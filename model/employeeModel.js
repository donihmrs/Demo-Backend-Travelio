const path = require('path');
const appDir = path.dirname(require.main.filename);
const lib = require(appDir+'/controller/lib')
const mysqlConf = require(appDir+'/controller/mysqlConf')

const employeeModel = {}

employeeModel.insertLastId = async (data) => {
    const conn = await mysqlConf.conn(data.database);
    const values = [data.emp_id,data.namaAkhir,data.namaDepan,data.namaTengah,'',0,data.tanggalLahir,83,data.kelamin,data.status,2
                    ,data.alamatKtp,data.alamatDomisili,data.noHp,data.tempatLahir,data.agama,data.umur,data.noKtp,data.npwp,data.namaBank
                    ,data.namaRekening,data.sim,data.jenisSim,data.kendaraan,data.jenisKendaraan];

    return await conn.promise().execute("INSERT INTO hs_hr_employee (employee_id,emp_lastname,emp_firstname,emp_middle_name,emp_nick_name"+
        ",emp_smoker,emp_birthday,nation_code,emp_gender,emp_marital_status,emp_status,emp_street1,emp_street2,emp_mobile,emp_tempat_lahir"+
        ",emp_agama,emp_umur,emp_no_ktp,emp_npwp,emp_nama_bank,emp_nama_rekening,emp_ada_sim,emp_jenis_sim"+
        ",emp_kendaraan,emp_jenis_kendaraan) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?) ",values)
            .then(([result, fields]) => {
                console.log("Berhasil tambah data karyawan / kandidat "+data.namaDepan+" "+data.namaAkhir)
                return lib.responseSuccess(result.insertId, "Berhasil insert data ke table hs_hr_employee")
            })
            .catch((err) => {
                console.log("Failed Execute Query "+String(err))
                return lib.responseError(400, "Failed Execute Query "+String(err))
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
                return lib.responseError(400, "Failed Execute Query "+String(err))
            })
            .finally(() => conn.end())
}

employeeModel.insertLamaran = async (data) => {
    const conn = await mysqlConf.conn(data.database);
    const values = [data.id_emp,data.jabatan,data.gajiTerakhir,data.gajiDiharapkan,data.tgl_masuk];
 
    return await conn.promise().execute("INSERT INTO hs_hr_emp_lamaran (emp_number,jabatan,gaji_terakhir,gaji_harapkan,tgl_masuk_kerja) VALUES (?,?,?,?,?) ",values)
            .then(([result, fields]) => {
                console.log("Berhasil tambah data lamaran dan gaji yang diharapkan")
                return lib.responseSuccess(result, "Berhasil insert data ke table hs_hr_emp_lamaran")
            })
            .catch((err) => {
                console.log("Failed Execute Query "+String(err))
                return lib.responseError(400, "Failed Execute Query "+String(err))
            })
            .finally(() => conn.end())
}

employeeModel.insertBahasa = async (data) => {
    const conn = await mysqlConf.conn(data.database);
    const values = [data.id_emp,data.id_bahasa,data.type,data.kompeten];
 
    return await conn.promise().execute("INSERT INTO hs_hr_emp_language (emp_number,lang_id,fluency,competency) VALUES (?,?,?,?) ",values)
            .then(([result, fields]) => {
                console.log("Berhasil insert nilai bahasa ke karyawan id number "+data.id_emp)
                return lib.responseSuccess(result, "Berhasil insert data ke table hs_hr_emp_language")
            })
            .catch((err) => {
                console.log("Failed Execute Query "+String(err))
                return lib.responseError(400, "Failed Execute Query "+String(err))
            })
            .finally(() => conn.end())
}

module.exports = employeeModel;