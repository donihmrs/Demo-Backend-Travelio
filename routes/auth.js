const express = require('express');
const router = express.Router();
const path = require('path');
const appDir = path.dirname(require.main.filename);
const token = require(appDir+'/controller/token')
const auth = require(appDir+'/controller/auth')

router.post('/validasi', function(req, res, next) {
    auth.validasi(req,res,next)
});

module.exports = router;