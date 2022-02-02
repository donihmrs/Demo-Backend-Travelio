const express = require('express');
const path = require('path');
const appDir = path.dirname(require.main.filename);
const token = require(appDir+'/controller/token')
const router = express.Router();
const client = require('redis-connection-pool')("redispool", {
    host: process.env.REDIS_HOST, 
    port: process.env.REDIS_PORT, 
    max_clients: 100, 
    database: 0,
});

const { match } = require('node-match-path')

router.get('/generate', function(req, res, next) {
    try {
        const whitelist = process.env.WHITELIST.split(",")
        let tempWl = []
        for (const key in whitelist) {
            if (Object.hasOwnProperty.call(whitelist, key)) {
                const ele = whitelist[key];
                if (ele.match(/\.\*/g)) {
                    tempWl.push(ele)
                }
            }
        }

        if (whitelist.indexOf(req.headers.origin.replace(/http:\/\/|https:\/\//ig,"")) !== -1) {
            client.get("token_mid", function(err, reply) {
                if (reply !== null) {
                    res.status(200).send(reply);
                } else {
                    let tokenJwt = token.generateJwt();

                    client.set("token_mid", tokenJwt,function(){
                        client.expire("token_mid",(parseInt(process.env.EXPIRED_TOKEN) - 1) * 60)
                    });;
                    res.status(200).send(tokenJwt);
                }
            });
            
        } else {
            for (const key in tempWl) {
                if (Object.hasOwnProperty.call(tempWl, key)) {
                    const ele = tempWl[key];
                    let valid = match(ele, req.headers.origin)
                    if (valid.matches) {
                        statusValidIp = true
                        client.get("token_mid", function(err, reply) {
                            if (reply !== null) {
                                res.status(200).send(reply);
                            } else {
                                let tokenJwt = token.generateJwt();
            
                                client.set("token_mid", tokenJwt,function(){
                                    client.expire("token_mid",(parseInt(process.env.EXPIRED_TOKEN) - 1) * 60)
                                });;
                                res.status(200).send(tokenJwt);
                            }
                        });    

                        break;
                    }
                }
            }
        
            if (statusValidIp == false) {
                res.status(400).send({"status":400,"message":"Not Authorized Get Token"});
            }
        }
    } catch(err) {
        console.log(err)
        res.status(400).send(null);
    }
});

module.exports = router;