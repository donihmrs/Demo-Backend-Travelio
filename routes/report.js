const express = require('express');
const router = express.Router();
const path = require('path');
const appDir = path.dirname(require.main.filename);
const token = require(appDir+'/controller/token')
const report = require(appDir+'/controller/report')

router.get('/getPayroll', function(req, res, next) {
    report.getPayroll(req,res,next)
});

router.get('/getPayrollJurnal', function(req, res, next) {
    report.getPayrollForJurnal(req,res,next)
});

router.post('/getSalaryEmp', function(req, res, next) {
    report.getSalaryEmp(req,res,next)
});

router.get('/getAbsensi', function(req, res, next) {
    report.getAbsensi(req,res,next)
});

module.exports = router;