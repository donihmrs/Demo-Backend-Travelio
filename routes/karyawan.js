const express = require('express');
const router = express.Router();
const path = require('path');
const appDir = path.dirname(require.main.filename);
const token = require(appDir+'/controller/token')
const karyawan = require(appDir+'/controller/karyawan')

router.post('/addKandidat', function(req, res, next) {
    karyawan.addKandidat(req,res,next)
});

router.get('/getAllKaryawan', function(req, res, next) {
    karyawan.getAllKaryawan(req,res,next)
});

router.post('/addPemotongan', function(req, res, next) {
    karyawan.addPemotongan(req,res,next)
});

router.get('/getAllPemotongan', function(req, res, next) {
    karyawan.getAllPemotongan(req,res,next)
});

router.delete('/deletePemotongan', function(req, res, next) {
    karyawan.deletePemotongan(req,res,next)
});

module.exports = router;