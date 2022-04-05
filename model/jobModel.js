const path = require('path');
const appDir = path.dirname(require.main.filename);
const lib = require(appDir+'/controller/lib')
const mysqlConf = require(appDir+'/controller/mysqlConf')

const jobModel = {}

jobModel.insertLastId = async (data) => {
    const conn = await mysqlConf.conn(data.database);
    const values = [data.nama];
    
    return await conn.promise().execute("INSERT INTO ohrm_job_title (job_title) VALUES (?) ",values)
            .then(([result, fields]) => {
                console.log("Berhasil tambah data job baru "+data.nama)
                return lib.responseSuccess(result.insertId, "Berhasil insert data ke table ohrm_job_title")
            })
            .catch((err) => {
                console.log("Failed Execute Query "+String(err))
                return lib.responseError(400, "Failed Execute Query "+String(err))
            })
            .finally(() => conn.end())
}

jobModel.getIdName = async (data) => {
    const conn = await mysqlConf.conn(data.database);
    return await conn.promise().execute("SELECT id as id,job_title FROM ohrm_job_title WHERE job_title = '"+data.nama+"';")
            .then(([rows, fields]) => {
                if (rows.length > 0) {
                    console.log("Berhasil get last id job title")
                    return lib.responseSuccess(rows[0].id, "Berhasil get last id job title dari table job_title")
                } else {
                    console.log("Tidak ada nama job")
                    return lib.responseSuccess(0, "tidak ada nama job "+data.nama+" pada table job_title")
                }
            })
            .catch((err) => {
                console.log("Failed Execute Query "+String(err))
                return lib.responseError(400, "Failed Execute Query "+String(err))
            })
            .finally(() => conn.end())
}

module.exports = jobModel;