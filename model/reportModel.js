const path = require('path');
const appDir = path.dirname(require.main.filename);
const lib = require(appDir+'/controller/lib')
const mysqlConf = require(appDir+'/controller/mysqlConf')

const reportModel = {}

reportModel.payroll = async (data) => {
    const conn = await mysqlConf.conn(data.database);

    return await conn.promise().execute("SELECT  empPotong.potongan_nilai,empPotong.emp_potong_keterangan,empPotong.start_date,empPotong.end_date,emp.emp_firstname,"+
    "emp.emp_lastname,emp.emp_middle_name,emp.emp_number,potong.pemot_nama,potong.pemot_type,potong.pemot_byr_karyawan,potong.pemot_byr_company,"+
    "salary.ebsal_basic_salary,salary.salary_component "+  
    "FROM `hs_hr_emp_potongan` AS empPotong LEFT JOIN `hs_hr_employee` AS emp "+
    "ON emp.emp_number = empPotong.emp_number LEFT JOIN `ohrm_pemotongan` AS potong "+
    "ON potong.pemotongan_id = empPotong.pemotongan_id  LEFT JOIN `hs_hr_emp_basicsalary` AS salary "+
    "ON  salary.emp_number = emp.emp_number "+
    "WHERE (salary.ebsal_basic_salary IS NOT NULL) AND (empPotong.end_date = '0000-00-00' OR empPotong.end_date BETWEEN '"+data.tahun+"-"+data.bulan+"-01' AND DATE(empPotong.end_date)) AND potong.pemot_status = 1;")
            .then(([rows, fields]) => {
                console.log("Berhasil get all payroll report")
                
                return lib.responseSuccess(rows, "Berhasil get all payroll report")
            })
            .catch((err) => {
                console.log("Failed Execute Query "+String(err))
                return lib.responseError(400, "Failed Execute Query "+String(err))
            })
            .finally(() => conn.end())
}

module.exports = reportModel;