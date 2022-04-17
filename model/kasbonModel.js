const path = require('path');
const appDir = path.dirname(require.main.filename);
const lib = require(appDir+'/controller/lib')
const mysqlConf = require(appDir+'/controller/mysqlConf')

const kasbonModel = {}

kasbonModel.getAllEmp = async (data) => {
    const conn = await mysqlConf.conn(data.database);

    let where = ""

    if (data.month !== null) {
        where = "WHERE MONTH(kas.kasbon_date) = '"+data.month+"' AND YEAR(kas.kasbon_date) = '"+data.year+"';"
    }

    return await conn.promise().execute("SELECT kas.*, emp.emp_firstname, emp.emp_lastname FROM hs_hr_emp_kasbon AS kas LEFT JOIN hs_hr_employee AS emp ON emp.emp_number = kas.emp_number "+where)
            .then(([rows, fields]) => {
                console.log("Berhasil get all kasbon")

                return lib.responseSuccess(rows, "Berhasil get all kasbon dari table hs_hr_emp_kasbon")
            })
            .catch((err) => {
                console.log("Failed Execute Query "+String(err))
                return lib.responseError(400, "Failed Execute Query "+String(err))
            })
            .finally(() => conn.end())
}

kasbonModel.insert = async (data) => {
    const conn = await mysqlConf.conn(data.database);
    const values = [data.emp,data.date,data.nilai,data.sisa,data.status];
    
    return await conn.promise().execute("INSERT INTO hs_hr_emp_kasbon (emp_number,kasbon_date,kasbon_nilai,kasbon_sisa,kasbon_status) VALUES (?,?,?,?,?) ",values)
            .then(([result, fields]) => {
                console.log("Berhasil tambah data kasbon "+data.nama)
                return lib.responseSuccess(result, "Berhasil insert data ke table hs_hr_emp_kasbon")
            })
            .catch((err) => {
                console.log("Failed Execute Query "+String(err))
                return lib.responseError(400, "Failed Execute Query "+String(err))
            })
            .finally(() => conn.end())
}

kasbonModel.delete = async (data) => {
    const conn = await mysqlConf.conn(data.database);
    const values = [data.id];

    return await conn.promise().execute("DELETE FROM ohrm_rincian_kasbon WHERE id_kasbon = ?",values)
            .then(async ([result, fields]) => {
                console.log("Berhasil Delete data kasbon")
                return await conn.promise().execute("DELETE FROM hs_hr_emp_kasbon WHERE id_kasbon = ?",values)
                    .then(([result, fields]) => {
                        console.log("Berhasil Delete data kasbon")
                        return lib.responseSuccess(result, "Berhasil Delete data kasbon")
                    })
                    .catch((err) => {
                        console.log("Failed Execute Query "+String(err))
                        return lib.responseError(400, "Failed Execute Query "+String(err))
                    })
            })
            .catch((err) => {
                console.log("Failed Execute Query "+String(err))
                return lib.responseError(400, "Failed Execute Query "+String(err))
            })
            .finally(() => conn.end())
}

kasbonModel.getSisaKasbon = async (data) => {
    const conn = await mysqlConf.conn(data.database);
    return await conn.promise().execute("SELECT kasbon_sisa FROM hs_hr_emp_kasbon WHERE id_kasbon = '"+data.id+"' AND kasbon_status = 0")
            .then(([rows, fields]) => {
                if (rows.length > 0) {
                    console.log("Berhasil get sisa kasbon")
                    return lib.responseSuccess(rows[0].kasbon_sisa, "Berhasil get sisa kasbon dari table hs_hr_emp_kasbon")
                } else {
                    console.log("Tidak ada sisa kasbon")
                    return lib.responseError(400, "Tidak ada sisa kasbon")
                }
            })
            .catch((err) => {
                console.log("Failed Execute Query "+String(err))
                return lib.responseError(400, "Failed Execute Query "+String(err))
            })
            .finally(() => conn.end())
}

kasbonModel.insertCicilan = async (data) => {
    const conn = await mysqlConf.conn(data.database);
    const values = [data.id,data.date,data.nilai];
    
    return await conn.promise().execute("INSERT INTO ohrm_rincian_kasbon (id_kasbon,bayar_date,bayar_jumlah) VALUES (?,?,?) ",values)
            .then(([result, fields]) => {
                console.log("Berhasil tambah data cicilan kasbon")
                return lib.responseSuccess(result, "Berhasil insert data ke table ohrm_rincian_kasbon")
            })
            .catch((err) => {
                console.log("Failed Execute Query "+String(err))
                return lib.responseError(400, "Failed Execute Query "+String(err))
            })
            .finally(() => conn.end())
}

kasbonModel.updateSisaKasbon = async (data) => {
    const conn = await mysqlConf.conn(data.database);
    const values = [data.sisaKasbon,data.status,data.id];
    
    return await conn.promise().execute("UPDATE hs_hr_emp_kasbon SET kasbon_sisa = ?,kasbon_status = ? WHERE id_kasbon = ?",values)
            .then(([result, fields]) => {
                console.log("Berhasil Update sisa kasbon ")
                return lib.responseSuccess(data.nama, "Berhasil Update data kasbon ke table hs_hr_emp_kasbon")
            })
            .catch((err) => {
                console.log("Failed Execute Query "+String(err))
                return lib.responseError(400, "Failed Execute Query "+String(err))
            })
            .finally(() => conn.end())
}

kasbonModel.getCicilanById = async (data) => {
    const conn = await mysqlConf.conn(data.database);
    return await conn.promise().execute("SELECT bayar_date, bayar_jumlah FROM ohrm_rincian_kasbon WHERE id_kasbon = "+data.id)
            .then(([rows, fields]) => {
                if (rows.length > 0) {
                    console.log("Berhasil get rincian kasbon")
                    return lib.responseSuccess(rows, "Berhasil get rincian kasbon dari table ohrm_rincian_kasbon")
                } else {
                    console.log("Tidak ada nama bahasa")
                    return lib.responseSuccess(0, "tidak ada nama bahasa "+data.nama+" pada table ohrm_rincian_kasbon")
                }
            })
            .catch((err) => {
                console.log("Failed Execute Query "+String(err))
                return lib.responseError(400, "Failed Execute Query "+String(err))
            })
            .finally(() => conn.end())
}

module.exports = kasbonModel;