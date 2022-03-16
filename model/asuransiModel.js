const path = require('path');
const appDir = path.dirname(require.main.filename);
const lib = require(appDir+'/controller/lib')
const mysqlConf = require(appDir+'/controller/mysqlConf')

const asuransiModel = {}

asuransiModel.insert = async (data) => {
    const conn = await mysqlConf.conn(data.database);
    const values = [data.nama,data.type,data.byrCompany,data.byrKaryawan];
    
    return await conn.promise().execute("INSERT INTO ohrm_insurance (insur_nama,insur_type,insur_byr_company,insur_byr_karyawan) VALUES (?,?,?,?) ",values)
            .then(([result, fields]) => {
                console.log("Berhasil tambah data asuransi baru "+data.nama)
                return lib.responseSuccess(data.nama, "Berhasil insert data ke table ohrm_insurance")
            })
            .catch((err) => {
                console.log("Failed Execute Query "+String(err))
                return lib.responseError(400, "Failed Execute Query "+String(err))
            })
            .finally(() => conn.end())
}

asuransiModel.getAll = async (db) => {
    const conn = await mysqlConf.conn(db);

    return await conn.promise().execute("SELECT * FROM ohrm_insurance;")
            .then(([rows, fields]) => {
                console.log("Berhasil get all asuransi")
                
                return lib.responseSuccess(rows, "Berhasil get all asuransi dari table ohrm_insurance")
            })
            .catch((err) => {
                console.log("Failed Execute Query "+String(err))
                return lib.responseError(400, "Failed Execute Query "+String(err))
            })
            .finally(() => conn.end())
}

module.exports = asuransiModel;