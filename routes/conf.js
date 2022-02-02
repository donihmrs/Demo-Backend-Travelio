const express = require('express');
const router = express.Router();
const axios = require("axios")
const path = require('path');
const appDir = path.dirname(require.main.filename);

const token = require(appDir+'/controller/token')

const client = require('redis-connection-pool')("redispool", {
    host: process.env.REDIS_HOST, 
    port: process.env.REDIS_PORT, 
    max_clients: 100, 
    database: 0,
});

router.post('/banner',token.verifyJwt, function(req, res, next) {
    try {
        client.get("bannerWeb_"+req.body.domain+"_"+req.body.language, function(err, reply) {
            if (reply !== null) {
                res.status(200).send(JSON.parse(reply));
            } else {
                token.tokenApiBe().then((tokenBe) => {
                    //0 = Top
                    //1 = Left
                    //2 = Right
                    //3 = Center
                    let data = {
                        "Post_Ads":req.body.id,
                        "Identitas":"Dari Mid Livescore",
                        "Message":"Get Ads Banner",
                        "domain":req.body.domain,
                        'lang':req.body.language
                    }
                    axios.post(process.env.API_BE+"/Api_Ads/getAds", data, {
                        headers: {
                            'Token_Jwt':tokenBe,
                        }
                    }
                    ).then(function(resAds) {
                        try {
                            if (resAds.data.status === 200) {
                                client.set("bannerWeb_"+req.body.domain+"_"+req.body.language, JSON.stringify(resAds.data), function(){
                                    client.expire("bannerWeb_"+req.body.domain+"_"+req.body.language,60)
                                });

                                res.status(200).send(resAds.data);
                            } else {
                                res.status(400).send(resAds.data);
                            }
                        } catch (err) {
                            res.status(500).send(err);
                        }
                    }).catch(function (error) {
                        console.log(error);
                        res.status(400).send(null);
                    });
                })
            }
        })
        
    } catch(err) {
        console.log(err)
        res.status(400).send(null);
    }
});

module.exports = router;