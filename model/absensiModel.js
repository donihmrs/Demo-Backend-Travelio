const path = require('path');
const appDir = path.dirname(require.main.filename);
const lib = require(appDir+'/controller/lib')
const mysqlConf = require(appDir+'/controller/mysqlConf')

const absensiModel = {}

absensiModel.insertUpdate = async (data) => {
    const conn = await mysqlConf.conn(data.database);
    const values = data.form

    return await conn.promise().query("INSERT INTO ohrm_attendance_record (employee_id,punch_date,punch_in_utc_time,punch_in_time_offset,punch_in_user_time,state) "+
        " VALUES ? ON DUPLICATE KEY UPDATE punch_out_utc_time = VALUES(punch_in_utc_time), punch_out_time_offset = VALUES(punch_in_time_offset), punch_out_user_time = VALUES(punch_in_user_time), state = VALUES(state) ",[values])
            .then(([result, fields]) => {
                console.log("Berhasil insert absensi")
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

absensiModel.report = async (data) => {
    const conn = await mysqlConf.conn(data.database);

    const sql = "SELECT concat(emp.emp_firstname, ' ',emp.emp_middle_name, ' ',emp.emp_lastname) AS fullName,"+
    " record.punch_in_user_time AS inTime, record.punch_out_user_time AS outTime, record.punch_in_time_offset AS inOffset, record.punch_out_time_offset AS outOffset"+
    " FROM hs_hr_employee AS emp LEFT JOIN `ohrm_attendance_record` AS record ON record.employee_id = emp.emp_number "+
    " WHERE record.punch_date BETWEEN '"+data.dateStart+"' AND '"+data.dateEnd+"'";

    return await conn.promise().execute(sql)
            .then(([rows, fields]) => {
                if (rows.length > 0) {
                    console.log("Berhasil get record absensi")
                    return lib.responseSuccess(rows, "Berhasil get record absensi dari table ohrm_attendance_record")
                } else {
                    console.log("Tidak ada data absensi pada tanggal "+data.dateStart+" - "+data.dateEnd)
                    return lib.responseSuccess([], "tidak ada tanggal absensi pada table ohrm_attendance_record")
                }
            })
            .catch((err) => {
                console.log("Failed Execute Query "+String(err))
                return lib.responseError(400, "Failed Execute Query "+String(err))
            })
            .finally(() => conn.end())
}

module.exports = absensiModel;