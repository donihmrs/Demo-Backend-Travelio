const express = require('express');
const router = express.Router();
const path = require('path');
const appDir = path.dirname(require.main.filename);
const token = require(appDir+'/controller/token')
const lib = require(appDir+'/controller/lib')
const mysqlConf = require(appDir+'/controller/mysqlConf')

router.post('/set',token.verifyJwt, async function(req, res, next) {
    try {
        const pool = await mysqlConf.pool(req.body.database);

        await pool.query("SELECT field FROM atable", function(err, rows, fields) {
            // Connection is automatically released when query resolves
        })

        res.status(200).send({
            status:200,
            data:{},
            message:"Success"
        })
    } catch(err) {
        console.log(err)
        res.status(500).send({
            status:500,
            data:{},
            message:"Error, Please check code or server"
        })
    }
});