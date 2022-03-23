const path = require('path');
const appDir = path.dirname(require.main.filename);
const token = require(appDir+'/controller/token')
const lib = require(appDir+'/controller/lib')
const axios = require('axios');
const { get } = require('http');

const reportModel = require(appDir+'/model/reportModel')

const report = {}

report.getPayroll =  async (req, res, next) => {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

    const db = req.query.database
    const bulan = req.query.bulan
    const tahun = req.query.tahun

    let data = {} 
    data['database'] = db
    data['bulan'] = lib.dateMonth(bulan)
    data['tahun'] = tahun

    const getData = await reportModel.payroll(data)
    let resObj = {}

    if (getData.status == 200 && getData.data.length > 0) {
        let allGaji = 0
        let allPemotongan = 0
        let allCompany = 0

        getData.data.forEach(ele => {
            if (resObj[ele.emp_number] == undefined) {
                resObj[ele.emp_number] = {}
                resObj[ele.emp_number]['gajiBersih'] = ele.ebsal_basic_salary
                resObj[ele.emp_number]['namaKaryawan'] = ele.emp_firstname+" "+ele.emp_middle_name+" "+ele.emp_lastname
                resObj[ele.emp_number]['namaSalary'] = ele.salary_component
                resObj[ele.emp_number]['pemotongan'] = []

                resObj[ele.emp_number]['totalPotongan'] = 0
                resObj[ele.emp_number]['companyPotongan'] = 0
                resObj[ele.emp_number]['gajiNett'] = parseInt(ele.ebsal_basic_salary)

                allGaji += parseInt(ele.ebsal_basic_salary)

                const objDetail = {}
                if (ele.potongan_nilai != 0) {
                    if (ele.pemot_type == "%") {
                        objDetail['debit'] = ele.ebsal_basic_salary * ele.potongan_nilai / 100                      
                        objDetail['company'] = 0
                    } else {
                        objDetail['debit'] = ele.potongan_nilai;
                        objDetail['company'] = 0
                    } 
                } else {
                    if (ele.pemot_type == "%" && parseInt(ele.pemot_byr_karyawan) != 0) {
                        objDetail['debit'] = ele.ebsal_basic_salary * parseInt(ele.pemot_byr_karyawan) / 100
                    } else {
                        objDetail['debit'] = parseInt(ele.pemot_byr_karyawan)
                    }

                    if (ele.pemot_type == "%" && parseInt(ele.pemot_byr_company) != 0) {
                        objDetail['company'] = ele.ebsal_basic_salary * parseInt(ele.pemot_byr_company) / 100
                    } else {
                        objDetail['company'] = parseInt(ele.pemot_byr_company)
                    }
                }

                resObj[ele.emp_number]['totalPotongan'] += objDetail['debit']
                resObj[ele.emp_number]['gajiNett'] -= objDetail['debit']
                resObj[ele.emp_number]['companyPotongan'] += objDetail['company']
                
                allGaji -= objDetail['debit']
                allPemotongan += objDetail['debit']
                allCompany += objDetail['company']

                objDetail['namaPemotongan'] = ele.pemot_nama
                objDetail['potongKeterangan'] = ele.emp_potong_keterangan
                
                resObj[ele.emp_number]['pemotongan'].push(objDetail)
            } else {
                const objDetail = {}
                if (ele.potongan_nilai != 0) {
                    if (ele.pemot_type == "%") {
                        objDetail['debit'] = ele.ebsal_basic_salary * ele.potongan_nilai / 100                      
                        objDetail['company'] = 0
                    } else {
                        objDetail['debit'] = ele.potongan_nilai;
                        objDetail['company'] = 0
                    }
                } else {
                    if (ele.pemot_type == "%" && parseFloat(ele.pemot_byr_karyawan) != 0) {
                        objDetail['debit'] = ele.ebsal_basic_salary * parseFloat(ele.pemot_byr_karyawan) / 100
                    } else {
                        objDetail['debit'] = parseFloat(ele.pemot_byr_karyawan)
                    }

                    if (ele.pemot_type == "%" && parseFloat(ele.pemot_byr_company) != 0) {
                        objDetail['company'] = ele.ebsal_basic_salary * parseFloat(ele.pemot_byr_company) / 100
                    } else {
                        objDetail['company'] = parseFloat(ele.pemot_byr_company)
                    }
                }

                resObj[ele.emp_number]['totalPotongan'] += objDetail['debit']
                resObj[ele.emp_number]['gajiNett'] -= objDetail['debit']
                resObj[ele.emp_number]['companyPotongan'] += objDetail['company']
                
                allGaji -= objDetail['debit']
                allPemotongan += objDetail['debit']
                allCompany += objDetail['company']

                objDetail['namaPemotongan'] = ele.pemot_nama
                objDetail['potongKeterangan'] = ele.emp_potong_keterangan
                
                resObj[ele.emp_number]['pemotongan'].push(objDetail)
            }
        });

        resObj['allGaji'] = allGaji
        resObj['allPemotongan'] = allPemotongan
        resObj['allCompany'] = allCompany

        getData.data = resObj
        res.status(200).send(getData)
    } else {
        res.status(400).send(getData)
    }
}

module.exports = report;