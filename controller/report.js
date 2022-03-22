const path = require('path');
const appDir = path.dirname(require.main.filename);
const token = require(appDir+'/controller/token')
const lib = require(appDir+'/controller/lib')

const reportModel = require(appDir+'/model/reportModel')

const report = {}

report.getPayroll =  async (req, res, next) => {
    const db = req.query.database
    const bulan = req.query.bulan
    const tahun = req.query.tahun

    let data = {} 
    data['database'] = db
    data['bulan'] = lib.dateMonth(bulan)
    data['tahun'] = tahun

    console.log(data)
    const getData = await reportModel.payroll(data)
    if (getData.status == 200 && getData.data.length > 0) {
        res.status(200).send(getData)
    } else {
        res.status(400).send(getData)
    }
}

module.exports = report;