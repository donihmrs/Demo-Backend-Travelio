const path = require('path');
const appDir = path.dirname(require.main.filename);
const lib = require(appDir+'/controller/lib')
const mysqlConf = require(appDir+'/controller/mysqlConf')

const pemotonganModel = {}

pemotonganModel.insert = async (data) => {
    const conn = await mysqlConf.conn(data.database);
    const values = [data.nama,data.type,data.byrCompany,data.byrKaryawan];
    
    return await conn.promise().execute("INSERT INTO ohrm_pemotongan (pemot_nama,pemot_type,pemot_byr_company,pemot_byr_karyawan) VALUES (?,?,?,?) ",values)
            .then(([result, fields]) => {
                console.log("Berhasil tambah data pemotongan baru "+data.nama)
                return lib.responseSuccess(data.nama, "Berhasil insert data ke table ohrm_pemotongan")
            })
            .catch((err) => {
                console.log("Failed Execute Query "+String(err))
                return lib.responseError(400, "Failed Execute Query "+String(err))
            })
            .finally(() => conn.end())
}

pemotonganModel.getAll = async (db) => {
    const conn = await mysqlConf.conn(db);

    return await conn.promise().execute("SELECT * FROM ohrm_pemotongan;")
            .then(([rows, fields]) => {
                console.log("Berhasil get all pemotongan")
                
                return lib.responseSuccess(rows, "Berhasil get all pemotongan dari table ohrm_pemotongan")
            })
            .catch((err) => {
                console.log("Failed Execute Query "+String(err))
                return lib.responseError(400, "Failed Execute Query "+String(err))
            })
            .finally(() => conn.end())
}

pemotonganModel.getAllSelectedOption = async (db) => {
    const conn = await mysqlConf.conn(db);

    return await conn.promise().execute("SELECT pemotongan_id,pemot_nama FROM ohrm_pemotongan;")
            .then(([rows, fields]) => {
                console.log("Berhasil get pemotongan untuk selected option")
                
                return lib.responseSuccess(rows, "Berhasil get pemotongan untuk selected option")
            })
            .catch((err) => {
                console.log("Failed Execute Query "+String(err))
                return lib.responseError(400, "Failed Execute Query "+String(err))
            })
            .finally(() => conn.end())
}

pemotonganModel.update = async (data) => {
    const conn = await mysqlConf.conn(data.database);
    const values = [data.type,data.byrCompany,data.byrKaryawan,data.id];
    
    return await conn.promise().execute("UPDATE ohrm_pemotongan SET pemot_type = ?,pemot_byr_company = ?,pemot_byr_karyawan = ? WHERE pemotongan_id = ?",values)
            .then(([result, fields]) => {
                console.log("Berhasil Update data pemotongan "+data.nama)
                return lib.responseSuccess(data.nama, "Berhasil Update data ke table ohrm_pemotongan")
            })
            .catch((err) => {
                console.log("Failed Execute Query "+String(err))
                return lib.responseError(400, "Failed Execute Query "+String(err))
            })
            .finally(() => conn.end())
}

pemotonganModel.cekData = async (data) => {
    const conn = await mysqlConf.conn(data.database);

    return await conn.promise().execute("SELECT pemotongan_id,pemot_nama FROM ohrm_pemotongan WHERE pemot_nama = ? ",[data.nama])
            .then(([rows, fields]) => {
                console.log("Berhasil cek data pemotongan")
                
                return lib.responseSuccess(rows, "Berhasil cek data pemotongan dari table ohrm_pemotongan")
            })
            .catch((err) => {
                console.log("Failed Execute Query "+String(err))
                return lib.responseError(400, "Failed Execute Query "+String(err))
            })
            .finally(() => conn.end())
}

pemotonganModel.statusData = async (data) => {
    const conn = await mysqlConf.conn(data.database);
    const values = [data.status,data.nama];
    
    return await conn.promise().execute("UPDATE ohrm_pemotongan SET pemot_status = ? WHERE pemot_nama = ?",values)
            .then(([result, fields]) => {
                console.log("Berhasil Update data pemotongan "+data.nama)
                return lib.responseSuccess(data.nama, "Berhasil Update data ke table ohrm_pemotongan")
            })
            .catch((err) => {
                console.log("Failed Execute Query "+String(err))
                return lib.responseError(400, "Failed Execute Query "+String(err))
            })
            .finally(() => conn.end())
}

module.exports = pemotonganModel;