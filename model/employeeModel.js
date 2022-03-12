const path = require('path');
const appDir = path.dirname(require.main.filename);
const lib = require(appDir+'/controller/lib')
const mysqlConf = require(appDir+'/controller/mysqlConf')

const employeeModel = {}

employeeModel.insertLastId = async (data) => {
    const conn = await mysqlConf.conn(data.database);
    const values = [data.emp_id,data.namaAkhir,data.namaDepan,data.namaTengah,'',0,data.tanggalLahir,83,1,data.kelamin,data.status,2
                    ,data.alamatKtp,data.alamatDomisili,data.noHp];

    return await conn.promise().execute("INSERT INTO hs_hr_employee (employee_id,emp_lastname,emp_firstname,emp_middle_name,emp_nick_name"+
        ",emp_smoker,emp_birthday,nation_code,emp_gender,emp_marital_status,emp_status,emp_street1,emp_street2,emp_mobile) VALUES (?) ",values)
            .then(([result, fields]) => {
                console.log("Berhasil tambah data karyawan / kandidat "+data.namaDepan+" "+data.namaAkhir)
                return lib.responseSuccess(result.insertId, "Berhasil insert data ke table hs_hr_employee")
            })
            .catch((err) => {
                console.log("Failed Execute Query "+String(err))
                return lib.responseSuccess(400, "Failed Execute Query "+String(err))
            })
            .finally(() => conn.end())
}

employeeModel.lastEmployeeId = async (db) => {
    const conn = await mysqlConf.conn(db);

    return await conn.promise().execute("SELECT MAX(employee_id) as id_last_emp FROM hs_hr_employee;")
            .then(([rows, fields]) => {
                console.log("Berhasil get last id employee")
                const maxId = parseInt(rows[0].id_last_emp) + 1

                return lib.responseSuccess(maxId, "Berhasil get last employee_id dari table hs_hr_employee")
            })
            .catch((err) => {
                console.log("Failed Execute Query "+String(err))
                return lib.responseSuccess(400, "Failed Execute Query "+String(err))
            })
            .finally(() => conn.end())
}

module.exports = employeeModel;