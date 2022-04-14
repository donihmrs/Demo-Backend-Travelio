const path = require('path');
const appDir = path.dirname(require.main.filename);
const lib = require(appDir+'/controller/lib')
const mysqlConf = require(appDir+'/controller/mysqlConf')

const tarifModel = {}

tarifModel.getAll = async (data) => {
    const conn = await mysqlConf.conn(data.database);

    return await conn.promise().execute("SELECT tarif_range_id AS tarifRangeId,tarif_name,tarif_group,tarif_type,tarif_min,tarif_max,tarif_val_min,tarif_val_max FROM ohrm_tarif_range;")
            .then(([rows, fields]) => {
                console.log("Berhasil get all tarif range")

                return lib.responseSuccess(rows, "Berhasil get all tarif range dari table ohrm_tarif_range")
            })
            .catch((err) => {
                console.log("Failed Execute Query "+String(err))
                return lib.responseError(400, "Failed Execute Query "+String(err))
            })
            .finally(() => conn.end())
}

module.exports = tarifModel;