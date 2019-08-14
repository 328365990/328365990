const router = require('koa-router')()
const http = require("http");
const https = require("https")
const path = require("path");
const url = require("url");
const fs = require("fs");
const superagent = require("superagent");
const cheerio = require("cheerio");
var bufferhelper = require("bufferhelper");

function get_html (ctx, next){
    return new Promise((resolve,reject)=>{
        superagent
            .get("https://m.che168.com/dealer/carlist.html?dealerid=213579")
            .end((error, response) => {                
                var content = response.text;                
                var $ = cheerio.load(content);                
                var result = [];                
                $("#CarList a").each((index, value) => {
                    result.push({
                        car_id: $(value).find(".source-card").parent().attr("id"),
                        car_name: $(value).find(" .source-card .souce-card-box div h3").text().trim(),
                        car_simple: $(value).find(" .source-card .souce-card-box div p").text(),
                        car_money: $(value).find(" .source-card .souce-card-box div div b").text(),
                        car_img_addr: $(value).find(" .source-card .souce-card-box .source-card-img img").attr("src"),
                        car_info_addr: $(value).find(".source-card").parent().attr("nqurl"),
                    });
                });
                fs.readFile('../get_html/b.json', 'utf-8',  (err, docs)=> {
                    if (docs != ''&&!err&&((JSON.parse(docs))[0]).car_id == result[0].car_id) {                        
                        resolve(JSON.parse(docs))                        
                    }
                    else {                        
                        var connter = 0
                        for (i = 0; i < result.length;) {
                            saveImg("https:" + result[i].car_img_addr, result[i].car_id, i)
                            i++;
                        }
                        function saveImg(src, id, i) {
                            https.get(src, function (res) {
                                var dataBuffer = new bufferhelper();
                                res.on('data', function (chunk) {                                    
                                    dataBuffer.concat(chunk);
                                }).on('end', function () {
                                    var con = dataBuffer.toBuffer();                                    
                                    fs.writeFile("../car_images/" + id + src.substr(src.lastIndexOf('.')), con, function (err) {
                                        if (err) console.log("Error: write file failure [" + err + "]");
                                        else {                                            
                                            result[i].car_img_addr = 'https://127.0.0.1/car_images/' + id + src.substr(src.lastIndexOf('.'))
                                            connter++
                                            if (connter == result.length) {                                                
                                                resolve(result)                                               
                                                result = JSON.stringify(result);                                                
                                                fs.writeFile("../get_html/b.json", result, "utf-8", (error) => {
                                                    if (error == null) {                                                    
                                                    }
                                                });
                                            }
                                        }
                                    });
                                }).on('error', function (e) {
                                    console.log("Got error:" + e.message);
                                });

                            });
                        }
                    }
                })

            });
    })
};

module.exports = get_html