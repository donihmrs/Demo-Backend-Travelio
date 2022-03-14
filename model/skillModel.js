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

skillModel.getIdName = async (data) => {
    const conn = await mysqlConf.conn(data.database);
    return await conn.promise().execute("SELECT id as id_skill,name FROM ohrm_skill WHERE name = '"+data.nama+"';")
            .then(([rows, fields]) => {
                if (rows.length > 0) {
                    console.log("Berhasil get last id skill")
                    return lib.responseSuccess(rows[0].id_skill, "Berhasil get last id skill dari table ohrm_skill")
                } else {
                    console.log("Tidak ada nama bahasa")
                    return lib.responseSuccess(0, "tidak ada nama skill "+data.nama+" pada table ohrm_skill")
                }
            })
            .catch((err) => {
                console.log("Failed Execute Query "+String(err))
                return lib.responseError(400, "Failed Execute Query "+String(err))
            })
            .finally(() => conn.end())
}

module.exports = skillModel;