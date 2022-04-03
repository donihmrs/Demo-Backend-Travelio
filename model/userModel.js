const path = require('path');
const appDir = path.dirname(require.main.filename);
const lib = require(appDir+'/controller/lib')
const mysqlConf = require(appDir+'/controller/mysqlConf')

const userModel = {}

userModel.getByUser = async (data) => {
    const conn = await mysqlConf.conn(data.database);

    return await conn.promise().execute("SELECT user_password FROM ohrm_user WHERE user_name = ? AND company_id = ? ",[data.username,data.company])
            .then(([rows, fields]) => {
                if (rows.length > 0) {
                    return lib.responseSuccess(rows, "Berhasil cek data username dari table ohrm_user")
                } else {
                    return lib.responseError(400, "Periksa kembali account login anda")
                }
            })
            .catch((err) => {
                console.log("Failed Execute Query "+String(err))
                return lib.responseError(500, "Failed Execute Query "+String(err))
            })
            .finally(() => conn.end())
}

module.exports = userModel;