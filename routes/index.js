const express = require('express');
const router = express.Router();
const path = require('path');
const appDir = path.dirname(require.main.filename);

const token = require(appDir+'/controller/token')

router.get('/',token.verifyJwt, function(req, res, next) {
    res.status(200).send({
        status:200,
        message:"SUKSES"
    })
});

module.exports = router;