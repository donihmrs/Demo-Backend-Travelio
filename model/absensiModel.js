const path = require('path');
const appDir = path.dirname(require.main.filename);
const lib = require(appDir+'/controller/lib')
const mysqlConf = require(appDir+'/controller/mysqlConf')

const absensiModel = {}

absensiModel.insertUpdate = async (data) => {
    const conn = await mysqlConf.conn(data.database);
    const values = [data.idEmp,data.date,data.dateUtc,data.offset,data.datetime,data.status];
    return await conn.promise().query("INSERT INTO ohrm_attendance_record (employee_id,punch_date,punch_in_utc_time,punch_in_time_offset,punch_in_user_time,state)"+
        " VALUES (?,?,?,?,?,?) ON DUPLICATE KEY UPDATE punch_out_utc_time = '"+data.dateUtc+"', punch_out_time_offset = '"+data.offset+"', punch_out_user_time = '"+data.datetime+"', state = '"+data.status+"' ",values)
            .then(([result, fields]) => {
                console.log("Berhasil insert abseni")
                return lib.responseSuccess(result, "Berhasil insert data ke table ohrm_attendance_record")
            })
            .catch((err) => {
                console.log("Failed Execute Query "+String(err))
                return lib.responseError(400, "Failed Execute Query "+String(err))
            })
            .finally(() => conn.end())
}

absensiModel.holiday = async (data) => {
    const conn = await mysqlConf.conn(data.database);
    return await conn.promise().execute("SELECT  `date` AS holiDate FROM `ohrm_holiday` WHERE MONTH(`date`)  = "+data.bulan+" AND YEAR(`date`)  = "+data.tahun+";")
            .then(([rows, fields]) => {
                if (rows.length > 0) {
                    console.log("Berhasil get tanggal holidays")
                    return lib.responseSuccess(rows, "Berhasil get id employee dari table ohrm_holiday")
                } else {
                    console.log("Tidak ada data")
                    return lib.responseSuccess([], "tidak ada tanggal holiday pada table ohrm_holiday")
                }
            })
            .catch((err) => {
                console.log("Failed Execute Query "+String(err))
                return lib.responseError(400, "Failed Execute Query "+String(err))
            })
            .finally(() => conn.end())
}

module.exports = absensiModel;