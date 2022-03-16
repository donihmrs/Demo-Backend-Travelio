const express = require('express');
const router = express.Router();
const path = require('path');
const appDir = path.dirname(require.main.filename);
const token = require(appDir+'/controller/token')
const setting = require(appDir+'/controller/setting')

router.post('/addAsuransi', function(req, res, next) {
    setting.addAsuransi(req,res,next)
});

router.get('/getAsuransi', function(req, res, next) {
    setting.getAsuransi(req,res,next)
});

module.exports = router;