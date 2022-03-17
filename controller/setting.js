const path = require('path');
const appDir = path.dirname(require.main.filename);
const token = require(appDir+'/controller/token')
const lib = require(appDir+'/controller/lib')

const pemotonganModel = require(appDir+'/model/pemotonganModel')

const setting = {}

setting.addPemotongan = async (req, res, next) => {
    try {
        let data = {}
        data['database'] = req.body.database

        data['nama'] = req.body.nama
        data['type'] = req.body.type
        data['byrCompany'] = req.body.byrPerusahaan
        data['byrKaryawan'] = req.body.byrKaryawan

        const cekData = await pemotonganModel.cekData(data)

        let insertUpdate;
        
        if (cekData.data.length == 0) {
            insertUpdate = await pemotonganModel.insert(data)
        } else {
            data['id'] = cekData.data[0].pemotongan_id
            insertUpdate = await pemotonganModel.update(data)
        }

        if (insertUpdate.status == 200) {
            res.status(200).send(insertUpdate)
        } else {
            res.status(400).send(insertUpdate)
        }
    } catch(e) {
        res.status(500).send(e)
    }
}

setting.getPemotongan =  async (req, res, next) => {
    const db = req.query.database

    const getData = await pemotonganModel.getAll(db)
    if (getData.status == 200 && getData.data.length > 0) {
        res.status(200).send(getData)
    } else {
        res.status(400).send(getData)
    }
}

setting.statusData =  async (req, res, next) => {
    let data = {}
    let status = 1
    
    data['database'] = req.body.database

    if (req.body.status == 1) {
        status = 0
    }

    data['nama'] = req.body.nama
    data['status'] = status

    const getData = await pemotonganModel.statusData(data)
    if (getData.status == 200 && getData.data.length > 0) {
        res.status(200).send(getData)
    } else {
        res.status(400).send(getData)
    }
}

module.exports = setting;