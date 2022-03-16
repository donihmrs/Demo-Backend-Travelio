const path = require('path');
const appDir = path.dirname(require.main.filename);
const token = require(appDir+'/controller/token')
const lib = require(appDir+'/controller/lib')

const asuransiModel = require(appDir+'/model/asuransiModel')

const setting = {}

setting.addAsuransi = async (req, res, next) => {
    try {
        let data = {}
        data['database'] = req.body.database

        data['nama'] = req.body.nama
        data['type'] = req.body.type
        data['byrCompany'] = req.body.byrPerusahaan
        data['byrKaryawan'] = req.body.byrKaryawan

        const insertData = await asuransiModel.insert(data)

        if (insertData.status == 200) {
            res.status(200).send(insertData)
        } else {
            res.status(400).send(insertData)
        }
    } catch(e) {
        res.status(500).send(e)
    }
}

setting.getAsuransi =  async (req, res, next) => {
    const getData = await asuransiModel.getAll()
    if (getData.status == 200 && getData.data.length > 0) {
        res.status(200).send(getData)
    } else {
        res.status(400).send(getData)
    }
}

setting.addPajak = async (req, res, next) => {

}

module.exports = setting;