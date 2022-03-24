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

    const getPtkp = await reportModel.ptkp(data)
    const dataPtkp = getPtkp.data

    let gajiEmp = {}

    if (getPtkp.status != 200 && getPtkp.data.length == 0) {
        res.status(400).send(getPtkp)
    } else {
        for (const key in dataPtkp) {
            if (Object.hasOwnProperty.call(dataPtkp, key)) {
                const ele = dataPtkp[key];
                if (gajiEmp[ele.emp_number] == undefined) {
                    gajiEmp[ele.emp_number] = {}
                    gajiEmp[ele.emp_number]['gajiEmp'] = parseInt(ele.ebsal_basic_salary)
                } else {
                    gajiEmp[ele.emp_number]['gajiEmp'] += parseInt(ele.ebsal_basic_salary) 
                }
            }
        }

        let tempPtkp = {}
        for (const key in dataPtkp) {
            if (Object.hasOwnProperty.call(dataPtkp, key)) {
                const ele = dataPtkp[key];
                if (tempPtkp[ele.emp_number] == undefined) {
                    tempPtkp[ele.emp_number] = {}
                    dataPtkp[key]['ebsal_basic_salary'] = gajiEmp[ele.emp_number]['gajiEmp']
                } else {
                    delete dataPtkp[key]
                }
            }
        }

        let ptkpObj = {}
        let flagKenaPajak = false
        
        //Hitung pajak
        for (const key in dataPtkp) {
            if (Object.hasOwnProperty.call(dataPtkp, key)) {
                const ele = dataPtkp[key];
                if (ptkpObj[ele.emp_number] == undefined) {
                    ptkpObj[ele.emp_number] = {}
                    ptkpObj[ele.emp_number]['emp_firstname'] = ele.emp_firstname
                    ptkpObj[ele.emp_number]['emp_lastname'] = ele.emp_lastname
                    ptkpObj[ele.emp_number]['emp_middle_name'] = ele.emp_middle_name
                    ptkpObj[ele.emp_number]['ebsal_basic_salary'] = ele.ebsal_basic_salary
                    ptkpObj[ele.emp_number]['salary_component'] = ele.salary_component

                    ptkpObj[ele.emp_number]['pajak'] = {}
                    ptkpObj[ele.emp_number]['pajak']['inisial_ptkp'] = ele.inisial_ptkp

                    const totalGajiSetahun = ele.ebsal_basic_salary * 12
                    if (totalGajiSetahun >= parseInt(ele.nilai_setahun_ptkp)) {
                        let byrJabatan = totalGajiSetahun * 5 /100
                        if (byrJabatan > 6000000) {
                            byrJabatan = 6000000
                        }

                        const gajiKurangJabatan = totalGajiSetahun - byrJabatan
                        const gajiKurangPtkp = gajiKurangJabatan - parseInt(ele.nilai_setahun_ptkp)

                        ptkpObj[ele.emp_number]['pajak']['limaPersen'] = (gajiKurangPtkp * 5 / 100) / 12
                        ptkpObj[ele.emp_number]['pajak']['limaPersenTahun'] = (gajiKurangPtkp * 5 / 100)
                        ptkpObj[ele.emp_number]['pajak']['pph21Karyawan'] = (gajiKurangPtkp * ele.byr_karyawan_ptkp / 100) / 12
                        ptkpObj[ele.emp_number]['pajak']['pph21KaryawanTahun'] = (gajiKurangPtkp * ele.byr_karyawan_ptkp / 100)
                        ptkpObj[ele.emp_number]['pajak']['pph21Company'] = (gajiKurangPtkp * ele.byr_company_ptkp / 100) / 12
                        ptkpObj[ele.emp_number]['pajak']['pph21CompanyTahun'] = (gajiKurangPtkp * ele.byr_company_ptkp / 100)
                    } else {
                        ptkpObj[ele.emp_number]['pajak']['limaPersen'] = 0
                        ptkpObj[ele.emp_number]['pajak']['limaPersenTahun'] = 0
                        ptkpObj[ele.emp_number]['pajak']['pph21Karyawan'] = 0
                        ptkpObj[ele.emp_number]['pajak']['pph21KaryawanTahun'] = 0
                        ptkpObj[ele.emp_number]['pajak']['pph21Company'] = 0
                        ptkpObj[ele.emp_number]['pajak']['pph21CompanyTahun'] = 0
                    }
                }
            }
        }

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

                    resObj[ele.emp_number]['totalPotongan'] += objDetail['debit'] + ptkpObj[ele.emp_number]['pajak']['pph21Karyawan']
                    resObj[ele.emp_number]['gajiNett'] -= objDetail['debit'] + ptkpObj[ele.emp_number]['pajak']['pph21Karyawan']
                    resObj[ele.emp_number]['companyPotongan'] += objDetail['company'] + ptkpObj[ele.emp_number]['pajak']['pph21Company']
                    
                    resObj[ele.emp_number]['gajiNett'] = Math.round(resObj[ele.emp_number]['gajiNett'] / 1000) * 1000
                    
                    allGaji -= objDetail['debit'] + ptkpObj[ele.emp_number]['pajak']['pph21Karyawan']
                    allPemotongan += objDetail['debit'] + ptkpObj[ele.emp_number]['pajak']['pph21Karyawan']
                    allCompany += objDetail['company'] + ptkpObj[ele.emp_number]['pajak']['pph21Company']

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
                    
                    resObj[ele.emp_number]['gajiNett'] = Math.round(resObj[ele.emp_number]['gajiNett'] / 1000) * 1000

                    allGaji -= objDetail['debit']
                    allPemotongan += objDetail['debit']
                    allCompany += objDetail['company']

                    objDetail['namaPemotongan'] = ele.pemot_nama
                    objDetail['potongKeterangan'] = ele.emp_potong_keterangan
                    
                    resObj[ele.emp_number]['pemotongan'].push(objDetail)
                }
            });

            resObj['allGaji'] = Math.round(allGaji / 1000) * 1000
            resObj['allPemotongan'] = allPemotongan
            resObj['allCompany'] = allCompany
        } 
        
        for (const key in ptkpObj) {
            if (Object.hasOwnProperty.call(ptkpObj, key)) {
                const ele = ptkpObj[key];
                if (resObj[key] == undefined) {
                    resObj[key] = {}
                    resObj[key]['gajiBersih'] = ele.ebsal_basic_salary
                    resObj[key]['namaKaryawan'] = ele.emp_firstname+" "+ele.emp_middle_name+" "+ele.emp_lastname
                    resObj[key]['namaSalary'] = ele.salary_component
                    resObj[key]['pemotongan'] = []

                    resObj[key]['totalPotongan'] = ele.pajak.pph21Karyawan
                    resObj[key]['companyPotongan'] = ele.pajak.pph21Company
                    resObj[key]['gajiNett'] = parseInt(ele.ebsal_basic_salary) - ele.pajak.pph21Karyawan
                    resObj[key]['pajak'] = ele.pajak

                    resObj['allGaji'] += resObj[key]['gajiNett']
                    resObj['allPemotongan'] += ele.pajak.pph21Karyawan
                    resObj['allCompany'] += ele.pajak.pph21Company
                } else {
                    resObj[key]['pajak'] = ele.pajak
                }
            }
        }

        getData.data = resObj
        res.status(200).send(getData)
    }
}

module.exports = report;