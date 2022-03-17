const express = require('express');
const router = express.Router();
const path = require('path');
const appDir = path.dirname(require.main.filename);
const token = require(appDir+'/controller/token')
const setting = require(appDir+'/controller/setting')

router.post('/addPemotongan', function(req, res, next) {
    setting.addPemotongan(req,res,next)
});

router.get('/getPemotongan', function(req, res, next) {
    setting.getPemotongan(req,res,next)
});

router.post('/statusPemotongan', function(req, res, next) {
    setting.statusData(req,res,next)
});

module.exports = router;