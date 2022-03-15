const path = require('path');
const appDir = path.dirname(require.main.filename);
const lib = require(appDir+'/controller/lib')
const mysqlConf = require(appDir+'/controller/mysqlConf')

const skillModel = {}

skillModel.insertLastId = async (data) => {
    const conn = await mysqlConf.conn(data.database);
    const values = [data.nama];
    
    return await conn.promise().execute("INSERT INTO ohrm_skill (name) VALUES (?) ",values)
            .then(([result, fields]) => {
                console.log("Berhasil tambah data skill baru "+data.nama)
                return lib.responseSuccess(result.insertId, "Berhasil insert data ke table ohrm_skill")
            })
            .catch((err) => {
                console.log("Failed Execute Query "+String(err))
                return lib.responseError(400, "Failed Execute Query "+String(err))
            })
            .finally(() => conn.end())
}

module.exports = skillModel;