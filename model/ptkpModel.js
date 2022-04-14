const path = require('path');
const appDir = path.dirname(require.main.filename);
const lib = require(appDir+'/controller/lib')
const mysqlConf = require(appDir+'/controller/mysqlConf')

const ptkpModel = {}

ptkpModel.getAll = async (data) => {
    const conn = await mysqlConf.conn(data.database);

    return await conn.promise().execute("SELECT ptkp_id as ptkpId, inisial_ptkp, nilai_setahun_ptkp, byr_company_ptkp, byr_karyawan_ptkp  FROM ohrm_ptkp;")
            .then(([rows, fields]) => {
                console.log("Berhasil get all ptkp")

                return lib.responseSuccess(rows, "Berhasil get all ptkp dari table ohrm_ptkp")
            })
            .catch((err) => {
                console.log("Failed Execute Query "+String(err))
                return lib.responseError(400, "Failed Execute Query "+String(err))
            })
            .finally(() => conn.end())
}

module.exports = ptkpModel;