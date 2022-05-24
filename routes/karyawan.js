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

router.post('/deleteAllPemotonganByType', function(req, res, next) {
    karyawan.deleteAllPemotonganByType(req,res,next)
});

router.get('/getAllPemotongan', function(req, res, next) {
    karyawan.getAllPemotongan(req,res,next)
});

router.delete('/deletePemotongan', function(req, res, next) {
    karyawan.deletePemotongan(req,res,next)
});

router.post('/importAllEmp', function(req, res, next) {
    karyawan.importAllEmp(req,res,next)
});

router.post('/absenFinger', function(req, res, next) {
    karyawan.absenFinger(req,res,next)
});

router.get('/getKasbonEmp', function(req, res, next) {
    karyawan.getKasbonEmp(req,res,next)
});

router.post('/addKasbon', function(req, res, next) {
    karyawan.addKasbon(req,res,next)
});

router.post('/delKasbonEmp', function(req, res, next) {
    karyawan.delKasbonEmp(req,res,next)
});

router.post('/addCicilanKasbon', function(req, res, next) {
    karyawan.addCicilanKasbon(req,res,next)
});

router.get('/getCicilanKasbonById', function(req, res, next) {
    karyawan.getCicilanKasbonById(req,res,next)
});

router.post('/delCicilanKasbonById', function(req, res, next) {
    karyawan.delCicilanKasbonById(req,res,next)
});

router.get('/getAllEmployeeFull', function(req, res, next) {
    karyawan.getAllEmployeeFull(req,res,next)
});

router.post('/updateJobsDesc', function(req, res, next) {
    karyawan.updateJobsDesc(req,res,next)
});


module.exports = router;