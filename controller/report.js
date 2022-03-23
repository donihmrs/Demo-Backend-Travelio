const path = require('path');
const appDir = path.dirname(require.main.filename);
const token = require(appDir+'/controller/token')
const lib = require(appDir+'/controller/lib')
const axios = require('axios');
const { get } = require('http');

const reportModel = require(appDir+'/model/reportModel')

const report = {}

report.getPayroll =  async (req, res, next) => {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

    const db = req.query.database
    const bulan = req.query.bulan
    const tahun = req.query.tahun

    let data = {} 
    data['database'] = db
    data['bulan'] = lib.dateMonth(bulan)
    data['tahun'] = tahun

    const getData = await reportModel.payroll(data)
    let resObj = {}

    if (getData.status == 200 && getData.data.length > 0) {

        getData.data.forEach(ele => {
            if (resObj[ele.emp_number] == undefined) {
                resObj[ele.emp_number] = []
                resObj["totalPot_"+ele.emp_number] = 0
                resObj[ele.emp_number].push(ele)
            } else {
                if (ele.potongan_nilai !== 0) {
                    resObj["totalPot_"+ele.emp_number] += ele.potongan_nilai;
                } else {
                    if (ele.pemot_byr_karyawan != 0) {
                        resObj["totalPot_"+ele.emp_number] += ele.ebsal_basic_salary * ele.pemot_byr_karyawan / 100
                    }
                }
                
                resObj[ele.emp_number].push(ele)
            }
        });

        getData.data = resObj
        res.status(200).send(getData)
    } else {
        res.status(400).send(getData)
    }
}

module.exports = report;