const path = require('path');
const appDir = path.dirname(require.main.filename);
const lib = require(appDir+'/controller/lib')
const mysqlConf = require(appDir+'/controller/mysqlConf')

const bahasaModel = {}

bahasaModel.insertLastId = async (data) => {
    const conn = await mysqlConf.conn(data.database);
    const values = [data.nama];
    
    return await conn.promise().execute("INSERT INTO ohrm_language (name) VALUES (?) ",values)
            .then(([result, fields]) => {
                console.log("Berhasil tambah data bahasa baru "+data.nama)
                return lib.responseSuccess(result.insertId, "Berhasil insert data ke table ohrm_language")
            })
            .catch((err) => {
                console.log("Failed Execute Query "+String(err))
                return lib.responseError(400, "Failed Execute Query "+String(err))
            })
            .finally(() => conn.end())
}

bahasaModel.getIdBahasa = async (data) => {
    const conn = await mysqlConf.conn(data.database);
    return await conn.promise().execute("SELECT id as id_bahasa,name FROM ohrm_language WHERE name = '"+data.nama+"';")
            .then(([rows, fields]) => {
                if (rows.length > 0) {
                    console.log("Berhasil get last id bahasa")
                    return lib.responseSuccess(rows[0].id_bahasa, "Berhasil get last id bahasa dari table ohrm_language")
                } else {
                    console.log("Tidak ada nama bahasa")
                    return lib.responseSuccess(0, "tidak ada nama bahasa "+data.nama+" pada table ohrm_language")
                }
            })
            .catch((err) => {
                console.log("Failed Execute Query "+String(err))
                return lib.responseError(400, "Failed Execute Query "+String(err))
            })
            .finally(() => conn.end())
}

module.exports = bahasaModel;