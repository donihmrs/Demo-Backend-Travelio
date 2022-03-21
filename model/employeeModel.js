const path = require('path');
const appDir = path.dirname(require.main.filename);
const lib = require(appDir+'/controller/lib')
const mysqlConf = require(appDir+'/controller/mysqlConf')

const employeeModel = {}

employeeModel.insertLastId = async (data) => {
    const conn = await mysqlConf.conn(data.database);
    const values = [data.emp_id,data.namaAkhir,data.namaDepan,data.namaTengah,'',0,data.tanggalLahir,83,data.kelamin,data.status,2
                    ,data.alamatKtp,data.alamatDomisili,data.noHp,data.tempatLahir,data.agama,data.umur,data.noKtp,data.npwp,data.namaBank
                    ,data.namaRekening,data.sim,data.jenisSim,data.kendaraan,data.jenisKendaraan,data.statusKaryawan];

    return await conn.promise().execute("INSERT INTO hs_hr_employee (employee_id,emp_lastname,emp_firstname,emp_middle_name,emp_nick_name"+
        ",emp_smoker,emp_birthday,nation_code,emp_gender,emp_marital_status,emp_status,emp_street1,emp_street2,emp_mobile,emp_tempat_lahir"+
        ",emp_agama,emp_umur,emp_no_ktp,emp_npwp,emp_nama_bank,emp_nama_rekening,emp_ada_sim,emp_jenis_sim"+
        ",emp_kendaraan,emp_jenis_kendaraan,status_karyawan) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?) ",values)
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

employeeModel.getAllEmployee = async (data) => {
    const conn = await mysqlConf.conn(data.database);

    return await conn.promise().execute("SELECT emp_number,emp_lastname,emp_firstname,emp_middle_name,employee_id FROM hs_hr_employee;")
            .then(([rows, fields]) => {
                console.log("Berhasil get all employee")

                return lib.responseSuccess(rows, "Berhasil get all employee_id dari table hs_hr_employee")
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

employeeModel.insertSkill = async (data) => {
    const conn = await mysqlConf.conn(data.database);
    const values = [data.id_emp,data.id_skill,1];
 
    return await conn.promise().execute("INSERT INTO hs_hr_emp_skill (emp_number,skill_id,years_of_exp) VALUES (?,?,?) ",values)
            .then(([result, fields]) => {
                console.log("Berhasil insert skill ke karyawan id number "+data.id_emp)
                return lib.responseSuccess(result, "Berhasil insert data ke table hs_hr_emp_skill")
            })
            .catch((err) => {
                console.log("Failed Execute Query "+String(err))
                return lib.responseError(400, "Failed Execute Query "+String(err))
            })
            .finally(() => conn.end())
}

//Untuk Keluarga
employeeModel.insertDependents = async (data) => {
    const conn = await mysqlConf.conn(data.database);
    const values = data.form
 
    return await conn.promise().query("INSERT INTO hs_hr_emp_dependents (emp_number,ed_seqno,ed_name,ed_relationship_type,ed_relationship,ed_date_of_birth"+
            ",ed_tmp_lahir,ed_kelamin,ed_pendidikan,ed_pekerjaan) VALUES ? ",[values])
            .then(([result, fields]) => {
                console.log("Berhasil insert hubungan keluarga ke karyawan id number "+data.form[0][0])
                return lib.responseSuccess(result, "Berhasil insert data ke table hs_hr_emp_dependents")
            })
            .catch((err) => {
                console.log("Failed Execute Query "+String(err))
                return lib.responseError(400, "Failed Execute Query "+String(err))
            })
            .finally(() => conn.end())
}

employeeModel.insertOrganisasi = async (data) => {
    const conn = await mysqlConf.conn(data.database);
    const values = data.form
 
    return await conn.promise().query("INSERT INTO hs_hr_emp_organisasi (emp_number,org_name,org_jenis,org_period_from,org_period_to,org_jabatan) VALUES ? ",[values])
            .then(([result, fields]) => {
                console.log("Berhasil insert organisasi ke karyawan id number "+data.form[0][0])
                return lib.responseSuccess(result, "Berhasil insert data ke table hs_hr_emp_organisasi")
            })
            .catch((err) => {
                console.log("Failed Execute Query "+String(err))
                return lib.responseError(400, "Failed Execute Query "+String(err))
            })
            .finally(() => conn.end())
}

employeeModel.insertEducation = async (data) => {
    const conn = await mysqlConf.conn(data.database);
    const values = [data.id_emp,data.id_edu,data.name,data.major,data.year,data.score,data.period_from,data.period_to,data.keterangan];
 
    return await conn.promise().execute("INSERT INTO ohrm_emp_education (emp_number,education_id,institute,major,year,score,start_date,end_date,keterangan) VALUES (?,?,?,?,?,?,?,?,?) ",values)
            .then(([result, fields]) => {
                console.log("Berhasil insert education ke karyawan id number "+data.id_emp)
                return lib.responseSuccess(result, "Berhasil insert data ke table ohrm_emp_education")
            })
            .catch((err) => {
                console.log("Failed Execute Query "+String(err))
                return lib.responseError(400, "Failed Execute Query "+String(err))
            })
            .finally(() => conn.end())
}

employeeModel.insertNonFormal = async (data) => {
    const conn = await mysqlConf.conn(data.database);
    const values = data.form
 
    return await conn.promise().query("INSERT INTO hs_hr_emp_non_formal (emp_number,non_jenis,non_period_from,non_period_to,non_penyelenggara,non_kota,non_sertifikat) VALUES ? ",[values])
            .then(([result, fields]) => {
                console.log("Berhasil insert non formal pendidikan ke karyawan id number "+data.form[0][0])
                return lib.responseSuccess(result, "Berhasil insert data ke table hs_hr_emp_non_formal")
            })
            .catch((err) => {
                console.log("Failed Execute Query "+String(err))
                return lib.responseError(400, "Failed Execute Query "+String(err))
            })
            .finally(() => conn.end())
}

employeeModel.insertPrestasi = async (data) => {
    const conn = await mysqlConf.conn(data.database);
    const values = data.form
 
    return await conn.promise().query("INSERT INTO hs_hr_emp_prestasi (emp_number,jenis,keterangan) VALUES ? ",[values])
            .then(([result, fields]) => {
                console.log("Berhasil insert prestasi ke karyawan id number "+data.form[0][0])
                return lib.responseSuccess(result, "Berhasil insert data ke table hs_hr_emp_prestasi")
            })
            .catch((err) => {
                console.log("Failed Execute Query "+String(err))
                return lib.responseError(400, "Failed Execute Query "+String(err))
            })
            .finally(() => conn.end())
}

employeeModel.insertReferensi = async (data) => {
    const conn = await mysqlConf.conn(data.database);
    const values = data.form
 
    return await conn.promise().query("INSERT INTO hs_hr_emp_emergency_contacts (emp_number,eec_seqno,eec_name,eec_relationship,eec_alamat,eec_mobile_no) VALUES ? ",[values])
            .then(([result, fields]) => {
                console.log("Berhasil insert emergensi kontak ke karyawan id number "+data.form[0][0])
                return lib.responseSuccess(result, "Berhasil insert data ke table hs_hr_emp_emergency_contacts")
            })
            .catch((err) => {
                console.log("Failed Execute Query "+String(err))
                return lib.responseError(400, "Failed Execute Query "+String(err))
            })
            .finally(() => conn.end())
}

employeeModel.insertRiwayatPekerjaan = async (data) => {
    const conn = await mysqlConf.conn(data.database);
    const values = data.form
 
    return await conn.promise().query("INSERT INTO hs_hr_emp_work_experience (emp_number,eexp_seqno,eexp_employer,eexp_jobtit,eexp_from_date"+
            ",eexp_to_date,eexp_comments,eexp_jenis,eexp_alamat,eexp_gaji,eexp_nama_pimpinan,eexp_nama_atasan,eexp_telepon,eexp_alasan) VALUES ? ",[values])
            .then(([result, fields]) => {
                console.log("Berhasil insert riwayat pekerjaan ke karyawan id number "+data.form[0][0])
                return lib.responseSuccess(result, "Berhasil insert data ke table hs_hr_emp_work_experience")
            })
            .catch((err) => {
                console.log("Failed Execute Query "+String(err))
                return lib.responseError(400, "Failed Execute Query "+String(err))
            })
            .finally(() => conn.end())
}

employeeModel.insertPemotongan = async (data) => {
    const conn = await mysqlConf.conn(data.database);
    const values = [data.nama,data.jenis,data.nilai,data.keterangan,data.tglMulai,data.tglAkhir];
    
    return await conn.promise().execute("INSERT INTO hs_hr_emp_potongan (emp_number,pemotongan_id,potongan_nilai,emp_potong_keterangan,start_date,end_date) VALUES (?,?,?,?,?,?) ",values)
            .then(([result, fields]) => {
                console.log("Berhasil tambah data pemotongan karyawan baru "+data.nama)
                return lib.responseSuccess(data.nama, "Berhasil insert data ke table hs_hr_emp_potongan")
            })
            .catch((err) => {
                console.log("Failed Execute Query "+String(err))
                return lib.responseError(400, "Failed Execute Query "+String(err))
            })
            .finally(() => conn.end())
}

employeeModel.getAllPemotongan = async (db) => {
    const conn = await mysqlConf.conn(db);

    return await conn.promise().execute("SELECT  empPotong.* , emp.emp_firstname,emp.emp_lastname,emp.emp_middle_name,potong.pemot_nama,potong.pemot_byr_karyawan,potong.pemot_type "+ 
            "FROM `hs_hr_emp_potongan` AS empPotong LEFT JOIN `hs_hr_employee` AS emp "+
            "ON emp.emp_number = empPotong.emp_number LEFT JOIN `ohrm_pemotongan` AS potong "+
            "ON potong.pemotongan_id = empPotong.pemotongan_id;")
            .then(([rows, fields]) => {
                console.log("Berhasil get all pemotongan")
                
                return lib.responseSuccess(rows, "Berhasil get all pemotongan dari table hs_hr_emp_potongan")
            })
            .catch((err) => {
                console.log("Failed Execute Query "+String(err))
                return lib.responseError(400, "Failed Execute Query "+String(err))
            })
            .finally(() => conn.end())
}

employeeModel.updatePemotongan = async (data) => {
    const conn = await mysqlConf.conn(data.database);
    const values = [data.nilai,data.keterangan,data.tglMulai,data.tglAkhir,data.id];
    
    return await conn.promise().execute("UPDATE hs_hr_emp_potongan SET potongan_nilai = ?,emp_potong_keterangan = ?,start_date = ?, end_date = ? WHERE emp_potongan_id = ?",values)
            .then(([result, fields]) => {
                console.log("Berhasil Update data pemotongan karyawan "+data.nama)
                return lib.responseSuccess(data.nama, "Berhasil Update data pemotongan karyawan ke table hs_hr_emp_potongan")
            })
            .catch((err) => {
                console.log("Failed Execute Query "+String(err))
                return lib.responseError(400, "Failed Execute Query "+String(err))
            })
            .finally(() => conn.end())
}

employeeModel.cekDataPemotongan = async (data) => {
    const conn = await mysqlConf.conn(data.database);

    return await conn.promise().execute("SELECT emp_potongan_id,emp_number,pemotongan_id FROM hs_hr_emp_potongan WHERE pemotongan_id = ? AND emp_number = ? ",[data.jenis,data.nama])
            .then(([rows, fields]) => {
                console.log("Berhasil cek data karyawan pemotongan")
                
                return lib.responseSuccess(rows, "Berhasil cek data karyawan pemotongan dari table hs_hr_emp_potongan")
            })
            .catch((err) => {
                console.log("Failed Execute Query "+String(err))
                return lib.responseError(400, "Failed Execute Query "+String(err))
            })
            .finally(() => conn.end())
}

module.exports = employeeModel;