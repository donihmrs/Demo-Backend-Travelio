const path = require('path');
const appDir = path.dirname(require.main.filename);
const lib = require(appDir+'/controller/lib')
const mysqlConf = require(appDir+'/controller/mysqlConf')

const reportModel = {}

reportModel.payroll = async (data) => {
    const conn = await mysqlConf.conn(data.database);
    const values = [data.bulan,data.tahun];

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

module.exports = reportModel;