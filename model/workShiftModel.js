const path = require('path');
const appDir = path.dirname(require.main.filename);
const lib = require(appDir+'/controller/lib')
const mysqlConf = require(appDir+'/controller/mysqlConf')

const workShiftModel = {}

workShiftModel.getShiftChangeDay = async (data) => {
    const conn = await mysqlConf.conn(data.database);
    return await conn.promise().execute("SELECT id as id_workshift FROM ohrm_work_shift WHERE start_time > end_time LIMIT 1;")
            .then(([rows, fields]) => {
                if (rows.length > 0) {
                    console.log("Berhasil get workshift")
                    return lib.responseSuccess(rows[0], "Berhasil get all workshift dari table ohrm_work_shift")
                } else {
                    console.log("Tidak ada data workshift")
                    return lib.responseError(400, "tidak ada data workshift")
                }
            })
            .catch((err) => {
                console.log("Failed Execute Query "+String(err))
                return lib.responseError(400, "Failed Execute Query "+String(err))
            })
            .finally(() => conn.end())
}

workShiftModel.getShiftRegular = async (data) => {
    const conn = await mysqlConf.conn(data.database);
    return await conn.promise().execute("SELECT id as id_workshift, start_time as startTime , end_time as endTime  FROM ohrm_work_shift WHERE start_time < end_time;")
            .then(([rows, fields]) => {
                if (rows.length > 0) {
                    console.log("Berhasil get workshift")
                    return lib.responseSuccess(rows, "Berhasil get all workshift regular dari table ohrm_work_shift")
                } else {
                    console.log("Tidak ada data workshift")
                    return lib.responseError(400, "tidak ada data workshift")
                }
            })
            .catch((err) => {
                console.log("Failed Execute Query "+String(err))
                return lib.responseError(400, "Failed Execute Query "+String(err))
            })
            .finally(() => conn.end())
}

workShiftModel.getShiftWorkEmpChangeDay = async (data) => {
    const conn = await mysqlConf.conn(data.database);
    return await conn.promise().execute("SELECT emp_number AS id_emp FROM ohrm_employee_work_shift WHERE work_shift_id = "+data.id+";")
            .then(([rows, fields]) => {
                if (rows.length > 0) {
                    console.log("Berhasil get workshift emp")
                    return lib.responseSuccess(rows, "Berhasil get all workshift emp dari table ohrm_employee_work_shift")
                } else {
                    console.log("Tidak ada data workshift emp")
                    return lib.responseError(400, "tidak ada data workshift emp")
                }
            })
            .catch((err) => {
                console.log("Failed Execute Query "+String(err))
                return lib.responseError(400, "Failed Execute Query "+String(err))
            })
            .finally(() => conn.end())
}

workShiftModel.getShiftWorkEmpRegular = async (data) => {
    const conn = await mysqlConf.conn(data.database);
    return await conn.promise().execute("SELECT work_shift_id AS id_work , emp_number AS id_emp FROM `ohrm_employee_work_shift` WHERE  `work_shift_id` IN ("+data.idArr+");")
            .then(([rows, fields]) => {
                if (rows.length > 0) {
                    console.log("Berhasil get workshift regular emp")
                    return lib.responseSuccess(rows, "Berhasil get all workshift emp dari table ohrm_employee_work_shift")
                } else {
                    console.log("Tidak ada data workshift emp")
                    return lib.responseError(400, "tidak ada data workshift emp")
                }
            })
            .catch((err) => {
                console.log("Failed Execute Query "+String(err))
                return lib.responseError(400, "Failed Execute Query "+String(err))
            })
            .finally(() => conn.end())
}

module.exports = workShiftModel;