const path = require('path');
const appDir = path.dirname(require.main.filename);
const token = require(appDir+'/controller/token')
const lib = require(appDir+'/controller/lib')
const axios = require('axios');
const { get } = require('http');
const { parse } = require('url');

const reportModel = require(appDir+'/model/reportModel')
const ptkpModel = require(appDir+'/model/ptkpModel')
const tarifModel = require(appDir+'/model/tarifModel')
const absensiModel = require(appDir+'/model/absensiModel')
const kasbonModel = require(appDir+'/model/kasbonModel')
const employeeModel = require(appDir+'/model/employeeModel')
const pemotonganModel = require(appDir+'/model/pemotonganModel')

const report = {}

function convertBpjsKsRange(ele, bpjsKs) {
    let byrBpjsKesehatan = parseFloat(ele.ebsal_basic_salary)

    //BPJS KESEHATAN
    if (ele.pemotongan_id === 1) {
        if (parseFloat(ele.ebsal_basic_salary) <= parseFloat(bpjsKs.tarif_min)) {
            byrBpjsKesehatan = parseFloat(bpjsKs.tarif_val_min)
        } else if (parseFloat(ele.ebsal_basic_salary) >= parseFloat(bpjsKs.tarif_max)) {
            byrBpjsKesehatan = parseFloat(bpjsKs.tarif_val_max)
        }
    }

    return parseFloat(byrBpjsKesehatan)
}

report.getPayroll =  async (req, res, next) => {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

    const db = req.query.database
    const bulan = req.query.bulan
    const tahun = req.query.tahun
    const emp = req.query.emp

    let data = {} 
    data['database'] = db
    data['bulan'] = lib.dateMonth(bulan)
    data['tahun'] = tahun
    data['emp'] = emp

    // const dataHoliday = await absensiModel.holiday(data)

    const getKasbon = await kasbonModel.getAllRincianEmp(data)
    let dataKasbon = []

    if (getKasbon.data.length > 0) {
        dataKasbon = getKasbon.data
    }

    const getPtkp = await reportModel.ptkp(data)
    const dataPtkp = getPtkp.data

    const getTarif = await tarifModel.getAll(data)
    
    let gajiEmp = {}
    let dataBpjsKs = {}
    
    if (getTarif != 200 && getTarif.data.length == 0) {
        res.status(400).send(getTarif)
    }

    const dataTarif = getTarif.data

    if (getPtkp.status != 200 && getPtkp.data.length == 0) {
        res.status(400).send(getPtkp)
    } else {

        for (const key in dataTarif) {
            if (Object.hasOwnProperty.call(dataTarif, key)) {
                const ele = dataTarif[key];
                
                if (ele.tarifRangeId === 1) {
                    dataBpjsKs = ele
    
                    break;
                }
            }
        }
        
        for (const key in dataPtkp) {
            if (Object.hasOwnProperty.call(dataPtkp, key)) {
                const ele = dataPtkp[key];
                if (gajiEmp[ele.emp_number] == undefined) {
                    gajiEmp[ele.emp_number] = {}
                    gajiEmp[ele.emp_number]['gajiEmp'] = parseFloat(ele.ebsal_basic_salary)
                } else {
                    gajiEmp[ele.emp_number]['gajiEmp'] += parseFloat(ele.ebsal_basic_salary) 
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

                    ptkpObj[ele.emp_number]['pajak']['pph21Karyawan'] = 0
                    ptkpObj[ele.emp_number]['pajak']['pph21Company'] = 0

                    await dataTarif.forEach(eleTarif => {
                        if (eleTarif.tarifRangeId !== 1) {
                            if (totalGajiSetahun >= parseFloat(ele.nilai_setahun_ptkp)) {
                                let byrJabatan = totalGajiSetahun * 5 /100
                                if (byrJabatan > 6000000) {
                                    byrJabatan = 6000000
                                }
        
                                const gajiKurangJabatan = totalGajiSetahun - byrJabatan
                                let tarifMin = parseFloat(eleTarif.tarif_min)

                                if (parseFloat(eleTarif.tarif_min) !== 0) {
                                    tarifMin = parseFloat(eleTarif.tarif_min) - 1
                                }
                                
                                const gajiKurangPtkp = (gajiKurangJabatan - parseFloat(ele.nilai_setahun_ptkp))

                                if (eleTarif.tarif_group === 2 && eleTarif.tarif_type === "%") {
                                    if (gajiKurangPtkp >= parseFloat(eleTarif.tarif_min)) {
                                        const persenPtkp = parseFloat(eleTarif.tarif_val_max)
                                        let byrPph = ((parseFloat(gajiKurangPtkp) - tarifMin) * persenPtkp / 100) / 12
                                        
                                        let byrPphMax = 0
                                        if (gajiKurangPtkp >= parseFloat(eleTarif.tarif_max)) {
                                            byrPphMax = ((parseFloat(eleTarif.tarif_max) - tarifMin) * persenPtkp / 100) / 12 

                                            byrPph = byrPphMax
                                        }

                                        if (ptkpObj[ele.emp_number]['pajak'][eleTarif.tarif_name] === undefined) {
                                            ptkpObj[ele.emp_number]['pajak'][eleTarif.tarif_name] = {}
                                            ptkpObj[ele.emp_number]['pajak'][eleTarif.tarif_name]['karyawan'] = Math.round((byrPph * parseFloat(ele.byr_karyawan_ptkp) / 5))
                                            ptkpObj[ele.emp_number]['pajak'][eleTarif.tarif_name]['company'] = Math.round((byrPph * parseFloat(ele.byr_company_ptkp) / 5)) 
                                        }
                                        
                                        ptkpObj[ele.emp_number]['pajak']['pph21Karyawan'] += Math.round((byrPph * parseFloat(ele.byr_karyawan_ptkp) / 5))
                                        ptkpObj[ele.emp_number]['pajak']['pph21Company'] += Math.round((byrPph * parseFloat(ele.byr_company_ptkp) / 5))
                                    }
                                }
                            } else {
                                ptkpObj[ele.emp_number]['pajak']['limaPersen'] = 0
                                ptkpObj[ele.emp_number]['pajak']['limaPersenTahun'] = 0
                                ptkpObj[ele.emp_number]['pajak']['pph21Karyawan'] = 0
                                ptkpObj[ele.emp_number]['pajak']['pph21Company'] = 0
                            }
                        }
                    });
                }
            }
        }

        const getData = await reportModel.payroll(data)
        let resObj = {}

        let allGaji = 0
        let allPemotongan = 0
        let allCompany = 0
        let flagNotPotong = 0

        if (getData.status == 200 && getData.data.length > 0) {
            await getData.data.forEach(ele => {
                flagNotPotong = 0

                if (resObj[ele.emp_number] == undefined) {
                    resObj[ele.emp_number] = {}
                    resObj[ele.emp_number]['kasbon'] = []
                    resObj[ele.emp_number]['gajiBersih'] = parseFloat(ele.ebsal_basic_salary)
                    resObj[ele.emp_number]['namaKaryawan'] = ele.emp_firstname+" "+ele.emp_middle_name+" "+ele.emp_lastname
                    resObj[ele.emp_number]['namaSalary'] = ele.salary_component
                    resObj[ele.emp_number]['pemotongan'] = []

                    resObj[ele.emp_number]['totalPotongan'] = 0
                    resObj[ele.emp_number]['companyPotongan'] = 0
                    resObj[ele.emp_number]['pembulatan'] = 0
                    resObj[ele.emp_number]['gajiNett'] = parseFloat(ele.ebsal_basic_salary)
                    resObj[ele.emp_number]['gajiNettStatic'] = parseFloat(ele.ebsal_basic_salary)

                    allGaji += parseFloat(ele.ebsal_basic_salary)

                    const objDetail = {}
                    
                    if (ele.potongan_nilai != 0) {
                        if (ele.pemot_type == "%") {     
                            objDetail['debit'] = Math.round(convertBpjsKsRange(ele,dataBpjsKs) * ele.potongan_nilai / 100)                 
                            objDetail['company'] = 0
                        } else {
                            objDetail['debit'] = ele.potongan_nilai;
                            objDetail['company'] = 0
                        } 
                    } else {
                        if (ele.pemot_type == "%" && parseFloat(ele.pemot_byr_karyawan) != 0) {
                            objDetail['debit'] = Math.round(convertBpjsKsRange(ele,dataBpjsKs) * parseFloat(ele.pemot_byr_karyawan) / 100)
                        } else {
                            objDetail['debit'] = parseFloat(ele.pemot_byr_karyawan)
                        }

                        if (ele.pemot_type == "%" && parseFloat(ele.pemot_byr_company) != 0) {
                            objDetail['company'] = Math.round(convertBpjsKsRange(ele,dataBpjsKs) * parseFloat(ele.pemot_byr_company) / 100)
                        } else {
                            objDetail['company'] = parseFloat(ele.pemot_byr_company)
                        }
                    }

                    resObj[ele.emp_number]['totalPotongan'] += objDetail['debit'] + ptkpObj[ele.emp_number]['pajak']['pph21Karyawan']
                    resObj[ele.emp_number]['gajiNett'] -= objDetail['debit'] + ptkpObj[ele.emp_number]['pajak']['pph21Karyawan']
                    resObj[ele.emp_number]['companyPotongan'] += objDetail['company'] + ptkpObj[ele.emp_number]['pajak']['pph21Company']
                    resObj[ele.emp_number]['gajiNettStatic'] -= objDetail['debit'] + ptkpObj[ele.emp_number]['pajak']['pph21Karyawan']
                    
                    const pembulatanGaji = Math.round(resObj[ele.emp_number]['gajiNettStatic'] / 1000) * 1000 
                    const gajiTanpaPembulatan = Math.round(resObj[ele.emp_number]['gajiNettStatic'])

                    resObj[ele.emp_number]['gajiNett'] = pembulatanGaji
                    
                    if (resObj[ele.emp_number]['pembulatan'] === 0) {
                        resObj[ele.emp_number]['pembulatan'] = pembulatanGaji  - gajiTanpaPembulatan
                    }

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
                            objDetail['debit'] = Math.round(convertBpjsKsRange(ele,dataBpjsKs) * ele.potongan_nilai / 100)                    
                            objDetail['company'] = 0
                        } else {
                            objDetail['debit'] = ele.potongan_nilai;
                            objDetail['company'] = 0
                        }
                    } else {
                        if (ele.pemot_type == "%" && parseFloat(ele.pemot_byr_karyawan) != 0) {
                            objDetail['debit'] = Math.round(convertBpjsKsRange(ele,dataBpjsKs) * parseFloat(ele.pemot_byr_karyawan) / 100)
                        } else {
                            objDetail['debit'] = parseFloat(ele.pemot_byr_karyawan)
                        }

                        if (ele.pemot_type == "%" && parseFloat(ele.pemot_byr_company) != 0) {
                            objDetail['company'] = Math.round(convertBpjsKsRange(ele,dataBpjsKs) * parseFloat(ele.pemot_byr_company) / 100)
                        } else {
                            objDetail['company'] = parseFloat(ele.pemot_byr_company)
                        }
                    }

                    resObj[ele.emp_number]['totalPotongan'] += objDetail['debit']
                    resObj[ele.emp_number]['gajiNett'] -= objDetail['debit']
                    resObj[ele.emp_number]['companyPotongan'] += objDetail['company']

                    resObj[ele.emp_number]['gajiNettStatic'] -= objDetail['debit']
                    
                    const pembulatanGaji = Math.round(resObj[ele.emp_number]['gajiNettStatic'] / 1000) * 1000 
                    const gajiTanpaPembulatan = Math.round(resObj[ele.emp_number]['gajiNettStatic'])

                    resObj[ele.emp_number]['gajiNett'] = pembulatanGaji
                    
                    resObj[ele.emp_number]['pembulatan'] = pembulatanGaji  - gajiTanpaPembulatan

                    allGaji -= objDetail['debit']
                    allPemotongan += objDetail['debit']
                    allCompany += objDetail['company']

                    objDetail['namaPemotongan'] = ele.pemot_nama
                    objDetail['potongKeterangan'] = ele.emp_potong_keterangan
                    
                    resObj[ele.emp_number]['pemotongan'].push(objDetail)
                }
            });
        } 


        await dataKasbon.forEach(ele => {
            if (resObj[ele.kasbonEmp] !== undefined) {
                if (ele.bayarKasDate !== null) {
                    const splitKasbonDate = lib.formatDateDb(ele.bayarKasDate)
                    const kasbonDateMonth = splitKasbonDate.split("-")[1]
                    const kasbonDateYear = splitKasbonDate.split("-")[0]
                    if (data['bulan'] === kasbonDateMonth && data['tahun'] === kasbonDateYear) {
                        flagNotPotong = 0

                        resObj[ele.kasbonEmp]['kasbon'].push(ele)
                        resObj[ele.kasbonEmp]['totalPotongan'] = resObj[ele.kasbonEmp]['totalPotongan'] + parseFloat(ele.bayarKasJumlah)
                        allPemotongan += parseFloat(ele.bayarKasJumlah)
                        allGaji -= parseFloat(ele.bayarKasJumlah)
                        resObj[ele.kasbonEmp]['gajiNett'] =  Math.round((parseFloat(resObj[ele.kasbonEmp]['gajiNettStatic']) - parseFloat(ele.bayarKasJumlah)) / 1000) * 1000
                    }
                }
            }
        });

        resObj['allGaji'] = {}

        resObj['allGaji']['nett'] = Math.round(allGaji)

        resObj['allPemotongan'] = allPemotongan
        resObj['allCompany'] = allCompany

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

                    if (resObj['allGaji']['nett'] === 0) {
                        flagNotPotong = 1
                        resObj['allGaji']['pembulatan'] = 0
                    }
                    
                    const pembulatanGaji = Math.round((parseFloat(ele.ebsal_basic_salary) - ele.pajak.pph21Karyawan) / 1000) * 1000
                    const tanpaPembulatanGaji = Math.round(parseFloat(ele.ebsal_basic_salary) - ele.pajak.pph21Karyawan)

                    resObj[key]['gajiNett'] = pembulatanGaji
                    resObj[key]['gajiNettStatic'] = tanpaPembulatanGaji
                    resObj[key]['pembulatan'] = pembulatanGaji - tanpaPembulatanGaji
                    resObj[key]['pajak'] = ele.pajak

                    resObj['allGaji']['nett'] += parseFloat(resObj[key]['gajiNett'])
                    resObj['allGaji']['pembulatan'] += parseFloat(tanpaPembulatanGaji)
                    
                    resObj['allPemotongan'] += ele.pajak.pph21Karyawan
                    resObj['allCompany'] += ele.pajak.pph21Company
                } else {
                    resObj[key]['pajak'] = ele.pajak
                }
            }
        }

        const pembulatanAllGaji =  Math.round(resObj['allGaji']['nett'] / 1000) * 1000

        let pembulatanTanpaAllGaji =  Math.round(resObj['allGaji']['nett'])

        if (flagNotPotong === 1) {
            flagNotPotong = 0
            pembulatanTanpaAllGaji = Math.round(resObj['allGaji']['pembulatan'])
        }

        resObj['allGaji']['nett'] = pembulatanAllGaji
        resObj['allGaji']['pembulatan'] = pembulatanAllGaji - pembulatanTanpaAllGaji

        getData.data = resObj

        if (Object.keys(getData.data).length === 0) {
            getData.status = 400
            getData.message = "Data is empty"
            res.status(400).send(getData)
        } else {
            res.status(200).send(getData)
        }
    }
}

report.getPayrollForJurnal =  async (req, res, next) => {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

    const db = req.query.database
    const bulan = req.query.bulan
    const tahun = req.query.tahun

    let data = {} 
    data['database'] = db
    data['bulan'] = lib.dateMonth(bulan)
    data['tahun'] = tahun
    data['emp'] = "all"

    const getPtkp = await reportModel.ptkp(data)
    const getTarif = await tarifModel.getAll(data)
    
    let gajiEmp = {}
    let dataBpjsKs = {}
    
    if (getTarif != 200 && getTarif.data.length == 0) {
        res.status(400).send(getTarif)
    }

    const dataTarif = getTarif.data

    const getKasbon = await kasbonModel.getAllRincianEmp(data)
    let dataKasbon = []

    if (getKasbon.data.length > 0) {
        dataKasbon = getKasbon.data
    }
    
    if (getPtkp.status != 200 && getPtkp.data.length == 0) {
        res.status(400).send(getPtkp)
    } else {
        const dataPtkp = getPtkp.data

        for (const key in dataPtkp) {
            if (Object.hasOwnProperty.call(dataPtkp, key)) {
                const ele = dataPtkp[key];
                if (gajiEmp[ele.emp_number] == undefined) {
                    gajiEmp[ele.emp_number] = {}
                    gajiEmp[ele.emp_number]['gajiEmp'] = parseFloat(ele.ebsal_basic_salary)
                } else {
                    gajiEmp[ele.emp_number]['gajiEmp'] += parseFloat(ele.ebsal_basic_salary) 
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
        
        let objTotal = {}
        objTotal['details'] = {}
        objTotal['details']['gajiBruto'] = 0
        objTotal['details']['bi_bpjs_ks'] = 0
        objTotal['details']['bi_bpjs_kt'] = 0
        objTotal['details']['hutang_bpjs_ks'] = 0
        objTotal['details']['hutang_bpjs_kt'] = 0
        objTotal['details']['bi_pph21'] = 0
        objTotal['details']['hutang_pph21'] = 0
        objTotal['details']['pembulatan'] = 0
        objTotal['details']['total_pinjaman_karyawan'] = 0
        objTotal['details']['emp'] = {}

        objTotal['keterangan'] = {}
        objTotal['keterangan']['bi_bpjs_ks'] = "Biaya BPJS Kesehatan"
        objTotal['keterangan']['bi_bpjs_kt'] = "Biaya BPJS Ketenagakerjaan"
        objTotal['keterangan']['hutang_bpjs_ks'] = "Hutang BPJS Kesehatan"
        objTotal['keterangan']['hutang_bpjs_kt'] = "Hutang BPJS Ketenagakerjaan"
        objTotal['keterangan']['bi_pph21'] = "Total Biaya Pajak Yang Ditanggung Karyawan"
        objTotal['keterangan']['hutang_pph21'] = "Total Biaya Pajak Yang Ditanggung Perusahaan"
        objTotal['keterangan']['pembulatan'] = "Total Pembulatan"
        objTotal['keterangan']['total_pinjaman_karyawan'] = "Total Pembayaran Kasbon dari keseluruhan Karyawan"
        objTotal['keterangan']['emp'] = "Berisikan Biaya-biaya per karyawan, seperti Kasbon"
        objTotal['keterangan']['gajiBruto'] = "Penghasilan kotor yang diterima karyawan"
        objTotal['keterangan']['gajiNett'] = "Penghasilan take-home pay atau yang diterima karyawan setelah semua pemotongan"

        //Hitung pajak
        for (const key in dataPtkp) {
            if (Object.hasOwnProperty.call(dataPtkp, key)) {
                const ele = dataPtkp[key];
                if (ptkpObj[ele.emp_number] == undefined) {
                    ptkpObj[ele.emp_number] = {}
                    ptkpObj[ele.emp_number]['ebsal_basic_salary'] = ele.ebsal_basic_salary
                    ptkpObj[ele.emp_number]['pajak'] = {}

                    const totalGajiSetahun = ele.ebsal_basic_salary * 12
                    if (totalGajiSetahun >= parseFloat(ele.nilai_setahun_ptkp)) {
                        let byrJabatan = totalGajiSetahun * 5 /100
                        if (byrJabatan > 6000000) {
                            byrJabatan = 6000000
                        }

                        let sumPpn = 0
                        await dataTarif.forEach(eleTarif => {

                            if (eleTarif.tarifRangeId !== 1) {
                                let tarifMin = parseFloat(eleTarif.tarif_min)
                                
                                if (parseFloat(eleTarif.tarif_min) !== 0) {
                                    tarifMin = parseFloat(eleTarif.tarif_min) - 1
                                }
                            
                                const gajiKurangJabatan = totalGajiSetahun - byrJabatan
                                const gajiKurangPtkp = (gajiKurangJabatan - parseFloat(ele.nilai_setahun_ptkp))
                            
                                if (eleTarif.tarif_group === 2 && eleTarif.tarif_type === "%") {
                                    if (gajiKurangPtkp >= eleTarif.tarif_min) {
                                        const persenPtkp = parseFloat(eleTarif.tarif_val_max)
                                        let byrPph = ((parseFloat(gajiKurangPtkp) - tarifMin) * persenPtkp / 100) / 12
                                        
                                        let byrPphMax = 0
                                        
                                        if (gajiKurangPtkp >= parseFloat(eleTarif.tarif_max)) {
                                            byrPphMax = ((parseFloat(eleTarif.tarif_max) - tarifMin) * persenPtkp / 100) / 12 

                                            byrPph = byrPphMax
                                        }

                                        sumPpn += byrPph
                                    }
                                }
                            }

                            if (eleTarif.tarifRangeId === 1) {
                                dataBpjsKs = eleTarif
                            }
                        });

                        ptkpObj[ele.emp_number]['pajak']['pph21Karyawan'] = Math.round((sumPpn * ele.byr_karyawan_ptkp / 5))
                        ptkpObj[ele.emp_number]['pajak']['pph21Company'] = Math.round((sumPpn * ele.byr_company_ptkp / 5))

                        objTotal['details']['bi_pph21'] += Math.round((sumPpn * ele.byr_karyawan_ptkp / 5))
                        objTotal['details']['hutang_pph21'] += Math.round((sumPpn * ele.byr_company_ptkp / 5))

                    } else {
                        ptkpObj[ele.emp_number]['pajak']['pph21Karyawan'] = 0
                        ptkpObj[ele.emp_number]['pajak']['pph21Company'] = 0
                    }
                }
            }
        }

        const getData = await reportModel.payroll(data)
        let resObj = {}

        if (getData.status == 200 && getData.data.length > 0) {
            getData.data.forEach(ele => {
                let byrBpjsKesehatan = parseFloat(ele.ebsal_basic_salary)

                if (parseFloat(ele.ebsal_basic_salary) <= parseFloat(dataBpjsKs.tarif_min)) {
                    byrBpjsKesehatan = parseFloat(dataBpjsKs.tarif_val_min)
                } else if (parseFloat(ele.ebsal_basic_salary) >= parseFloat(dataBpjsKs.tarif_max)) {
                    byrBpjsKesehatan = parseFloat(dataBpjsKs.tarif_val_max)
                }

                if (resObj[ele.emp_number] == undefined) {
                    resObj[ele.emp_number] = {}
                    // resObj[ele.emp_number]['gajiNett'] = parseFloat(ele.ebsal_basic_salary)
                    objTotal['details']['gajiBruto'] += parseFloat(ele.ebsal_basic_salary)

                    const objDetail = {}

                    if (ele.potongan_nilai != 0) {
                        if (ele.pemot_type == "%") {
                            objDetail['debit'] = ele.ebsal_basic_salary * ele.potongan_nilai / 100    
                            if (ele.pemot_group == 1) {
                                objTotal['details']['bi_bpjs_ks'] += byrBpjsKesehatan * ele.potongan_nilai / 100    
                                objTotal['details']['hutang_bpjs_ks'] += 0
                            } else if (ele.pemot_group == 2) {
                                objTotal['details']['bi_bpjs_kt'] += ele.ebsal_basic_salary * ele.potongan_nilai / 100    
                                objTotal['details']['hutang_bpjs_kt'] += 0
                            } 
                        } else {
                            objDetail['debit'] = ele.potongan_nilai;

                            if (ele.pemot_group == 1) {
                                objTotal['details']['bi_bpjs_ks'] += ele.potongan_nilai  
                                objTotal['details']['hutang_bpjs_ks'] += 0
                            } else if (ele.pemot_group == 2) {
                                objTotal['details']['bi_bpjs_kt'] += ele.potongan_nilai    
                                objTotal['details']['hutang_bpjs_kt'] += 0
                            } 
                        }
                    } else {
                        if (ele.pemot_type == "%" && parseFloat(ele.pemot_byr_karyawan) != 0) {
                            objDetail['debit'] = ele.ebsal_basic_salary * parseFloat(ele.pemot_byr_karyawan) / 100
                            
                            if (ele.pemot_group == 1) {
                                objTotal['details']['bi_bpjs_ks'] += byrBpjsKesehatan * parseFloat(ele.pemot_byr_karyawan) / 100    
                            } else if (ele.pemot_group == 2) {
                                objTotal['details']['bi_bpjs_kt'] += ele.ebsal_basic_salary * parseFloat(ele.pemot_byr_karyawan) / 100    
                            } 

                        } else {
                            objDetail['debit'] = parseFloat(ele.pemot_byr_karyawan)
                            if (ele.pemot_group == 1) {
                                objTotal['details']['bi_bpjs_ks'] += parseFloat(ele.pemot_byr_karyawan)    
                            } else if (ele.pemot_group == 2) {
                                objTotal['details']['bi_bpjs_kt'] += parseFloat(ele.pemot_byr_karyawan)
                            } 
                        }

                        if (ele.pemot_type == "%" && parseFloat(ele.pemot_byr_company) != 0) {
                            if (ele.pemot_group == 1) {
                                objTotal['details']['hutang_bpjs_ks'] += byrBpjsKesehatan * parseFloat(ele.pemot_byr_company) / 100    
                            } else if (ele.pemot_group == 2) {
                                objTotal['details']['hutang_bpjs_kt'] += ele.ebsal_basic_salary * parseFloat(ele.pemot_byr_company) / 100    
                            }
                        } else {
                            if (ele.pemot_group == 1) {
                                objTotal['details']['hutang_bpjs_ks'] += parseFloat(ele.pemot_byr_company)    
                            } else if (ele.pemot_group == 2) {
                                objTotal['details']['hutang_bpjs_kt'] += parseFloat(ele.pemot_byr_company)    
                            }
                        }
                    }
                } else {
                    const objDetail = {}
                    if (parseFloat(ele.potongan_nilai) != 0) {
                        if (ele.pemot_type == "%") {
                            objDetail['debit'] = ele.ebsal_basic_salary * parseFloat(ele.potongan_nilai) / 100   
                            
                            if (ele.pemot_group == 1) {
                                objTotal['details']['bi_bpjs_ks'] += byrBpjsKesehatan * parseFloat(ele.potongan_nilai) / 100    
                                objTotal['details']['hutang_bpjs_ks'] += 0
                            } else if (ele.pemot_group == 2) {
                                objTotal['details']['bi_bpjs_kt'] += ele.ebsal_basic_salary * parseFloat(ele.potongan_nilai) / 100    
                                objTotal['details']['hutang_bpjs_kt'] += 0
                            } 
                        } else {
                            objDetail['debit'] = ele.potongan_nilai;

                            if (ele.pemot_group == 1) {
                                objTotal['details']['bi_bpjs_ks'] += ele.potongan_nilai  
                                objTotal['details']['hutang_bpjs_ks'] += 0
                            } else if (ele.pemot_group == 2) {
                                objTotal['details']['bi_bpjs_kt'] += ele.potongan_nilai  
                                objTotal['details']['hutang_bpjs_kt'] += 0
                            } 
                        }
                    } else {
                        if (ele.pemot_type == "%" && parseFloat(ele.pemot_byr_karyawan) != 0) {
                            objDetail['debit'] = ele.ebsal_basic_salary * parseFloat(ele.pemot_byr_karyawan) / 100

                            if (ele.pemot_group == 1) {
                                objTotal['details']['bi_bpjs_ks'] += byrBpjsKesehatan * parseFloat(ele.pemot_byr_karyawan) / 100    
                            } else if (ele.pemot_group == 2) {
                                objTotal['details']['bi_bpjs_kt'] += ele.ebsal_basic_salary * parseFloat(ele.pemot_byr_karyawan) / 100    
                            } 

                        } else {
                            objDetail['debit'] = parseFloat(ele.pemot_byr_karyawan)

                            if (ele.pemot_group == 1) {
                                objTotal['details']['bi_bpjs_ks'] += parseFloat(ele.pemot_byr_karyawan)    
                            } else if (ele.pemot_group == 2) {
                                objTotal['details']['bi_bpjs_kt'] += parseFloat(ele.pemot_byr_karyawan)    
                            }
                        }

                        if (ele.pemot_type == "%" && parseFloat(ele.pemot_byr_company) != 0) {
                            if (ele.pemot_group == 1) {
                                objTotal['details']['hutang_bpjs_ks'] += byrBpjsKesehatan * parseFloat(ele.pemot_byr_company) / 100    
                            } else if (ele.pemot_group == 2) {
                                objTotal['details']['hutang_bpjs_kt'] += ele.ebsal_basic_salary * parseFloat(ele.pemot_byr_company) / 100    
                            }
                        } else {
                            if (ele.pemot_group == 1) {
                                objTotal['details']['hutang_bpjs_ks'] += parseFloat(ele.pemot_byr_company)    
                            } else if (ele.pemot_group == 2) {
                                objTotal['details']['hutang_bpjs_kt'] += parseFloat(ele.pemot_byr_company)    
                            }
                        }
                    }
                }
            });
        } 

        objTotal['details']['emp']['kasbon'] = []
        let empKasbonTemp = []

        dataKasbon.forEach(ele => {
            if (ele.bayarKasDate !== null) {               
                const splitKasbonDate = lib.formatDateDb(ele.bayarKasDate)
                const kasbonDateMonth = splitKasbonDate.split("-")[1]
                const kasbonDateYear = splitKasbonDate.split("-")[0]
                if (data['bulan'] === kasbonDateMonth && data['tahun'] === kasbonDateYear) {
                    delete ele.kasbonDate;
                    ele.bayarKasDate = lib.formatDateDb(ele.bayarKasDate)
                    ele.kasbonNilai = 0
                    ele['kasbonDate'] = null
                    if (ele.emp_middle_name !== "" && ele.emp_lastname !== "") {
                        ele['namaKaryawan'] = ele.emp_firstname
                    } else if (ele.emp_middle_name !== "") {
                        ele['namaKaryawan'] = ele.emp_firstname+" "+ele.emp_middle_name+" "+ele.emp_lastname
                    } else {
                        ele['namaKaryawan'] = ele.emp_firstname+" "+ele.emp_lastname
                    }
                    delete ele.emp_firstname
                    delete ele.emp_middle_name
                    delete ele.emp_lastname

                    empKasbonTemp.push(ele.kasbonEmp)
                    
                    objTotal['details']['emp']['kasbon'].push(ele)
                    objTotal['details']['total_pinjaman_karyawan'] += parseFloat(ele.bayarKasJumlah)
                }
            }
        });

        const getKasbonAwal = await kasbonModel.getAllKasbonReport(data)
        let dataKasbonAwal = []

        if (getKasbonAwal.data.length > 0) {
            dataKasbonAwal = getKasbonAwal.data
        }

        for (const key in dataKasbonAwal) {
            if (Object.hasOwnProperty.call(dataKasbonAwal, key)) {
                const ele = dataKasbonAwal[key];
                if (!empKasbonTemp.includes(ele.emp_number)) {
                    let objKasbon = {}
                    objKasbon['kasbonEmp'] = ele.emp_number
                    
                    if (ele.emp_middle_name !== "" && ele.emp_lastname !== "") {
                        objKasbon['namaKaryawan'] = ele.emp_firstname
                    } else if (ele.emp_middle_name !== "") {
                        objKasbon['namaKaryawan'] = ele.emp_firstname+" "+ele.emp_middle_name+" "+ele.emp_lastname
                    } else {
                        objKasbon['namaKaryawan'] = ele.emp_firstname+" "+ele.emp_lastname
                    }

                    objKasbon['kasbonNilai'] = ele.kasbon_nilai
                    objKasbon['kasbonSisa'] = 0
                    objKasbon['kasbonDate'] = lib.formatDateDb(ele.kasbon_date)
                    objKasbon['bayarKasDate'] = null
                    objKasbon['bayarKasJumlah'] = 0

                    objTotal['details']['emp']['kasbon'].push(objKasbon)
                }
            }
        }

        objTotal['details']['gajiNett'] = 0
        
        for (const key in ptkpObj) {
            if (Object.hasOwnProperty.call(ptkpObj, key)) {
                const ele = ptkpObj[key];
                if (resObj[key] == undefined) {
                    objTotal['details']['gajiBruto'] += parseFloat(ele.ebsal_basic_salary)
                }
            }
        }

        const pembAsuransiKaryawan_ks = Math.round(objTotal['details']['bi_bpjs_ks'] / 1000) * 1000
        const pembAsuransiCompany_ks = Math.round(objTotal['details']['hutang_bpjs_ks'] / 1000) * 1000
        const pembAsuransiKaryawan_kt = Math.round(objTotal['details']['bi_bpjs_kt'] / 1000) * 1000
        const pembAsuransiCompany_kt = Math.round(objTotal['details']['hutang_bpjs_kt'] / 1000) * 1000
        const pembKaryawan_pajak = Math.round(objTotal['details']['bi_pph21'] / 1000) * 1000
        const pembCompany_pajak = Math.round(objTotal['details']['hutang_pph21'] / 1000) * 1000
        const pembGajiNett = objTotal['details']['gajiBruto'] - (pembAsuransiKaryawan_ks + pembAsuransiKaryawan_kt + pembKaryawan_pajak + objTotal['details']['total_pinjaman_karyawan'])
        
        objTotal['details']['gajiNett'] = Math.round(pembGajiNett / 1000) * 1000

        objTotal['details']['bi_bpjs_ks'] = pembAsuransiCompany_ks
        objTotal['details']['hutang_bpjs_ks'] = pembAsuransiCompany_ks + pembAsuransiKaryawan_ks
        objTotal['details']['bi_bpjs_kt'] = pembAsuransiCompany_kt
        objTotal['details']['hutang_bpjs_kt'] = pembAsuransiCompany_kt + pembAsuransiKaryawan_kt
        objTotal['details']['bi_pph21'] = pembCompany_pajak
        objTotal['details']['hutang_pph21'] = pembCompany_pajak + pembKaryawan_pajak

        const totalCredit = objTotal['details']['gajiBruto'] + objTotal['details']['bi_bpjs_ks'] + objTotal['details']['bi_bpjs_kt'] + objTotal['details']['bi_pph21']

        const totalDebit = objTotal['details']['hutang_bpjs_ks'] + objTotal['details']['hutang_bpjs_kt'] + objTotal['details']['hutang_pph21'] + objTotal['details']['gajiNett'] + objTotal['details']['total_pinjaman_karyawan']
        
        objTotal['details']['pembulatan'] = totalDebit - totalCredit

        getData.data = objTotal

        if (Object.keys(getData.data).length === 0) {
            getData.status = 400
            getData.message = "Data is empty"
            res.status(400).send(getData)
        } else {
            res.status(200).send(getData)
        }
    }
}

report.getPayrollExportDetail =  async (req, res, next) => {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

    const db = req.query.database
    const bulan = req.query.bulan
    const tahun = req.query.tahun
    const emp = req.query.emp

    let data = {} 
    data['database'] = db
    data['bulan'] = lib.dateMonth(bulan)
    data['tahun'] = tahun
    data['emp'] = emp

    // const dataHoliday = await absensiModel.holiday(data)

    const getKasbon = await kasbonModel.getAllRincianEmp(data)
    let dataKasbon = []

    if (getKasbon.data.length > 0) {
        dataKasbon = getKasbon.data
    }

    const getPtkp = await reportModel.ptkp(data)
    const dataPtkp = getPtkp.data

    const getTarif = await tarifModel.getAll(data)
    
    let gajiEmp = {}
    let dataBpjsKs = {}
    
    if (getTarif != 200 && getTarif.data.length == 0) {
        res.status(400).send(getTarif)
    }

    const dataTarif = getTarif.data

    if (getPtkp.status != 200 && getPtkp.data.length == 0) {
        res.status(400).send(getPtkp)
    } else {

        for (const key in dataTarif) {
            if (Object.hasOwnProperty.call(dataTarif, key)) {
                const ele = dataTarif[key];
                
                if (ele.tarifRangeId === 1) {
                    dataBpjsKs = ele
    
                    break;
                }
            }
        }
        
        for (const key in dataPtkp) {
            if (Object.hasOwnProperty.call(dataPtkp, key)) {
                const ele = dataPtkp[key];
                if (gajiEmp[ele.emp_number] == undefined) {
                    gajiEmp[ele.emp_number] = {}
                    gajiEmp[ele.emp_number]['gajiEmp'] = parseFloat(ele.ebsal_basic_salary)
                } else {
                    gajiEmp[ele.emp_number]['gajiEmp'] += parseFloat(ele.ebsal_basic_salary) 
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

                    ptkpObj[ele.emp_number]['pajak']['pph21Karyawan'] = 0
                    ptkpObj[ele.emp_number]['pajak']['pph21Company'] = 0

                    await dataTarif.forEach(eleTarif => {
                        if (eleTarif.tarifRangeId !== 1) {
                            if (totalGajiSetahun >= parseFloat(ele.nilai_setahun_ptkp)) {
                                let byrJabatan = totalGajiSetahun * 5 /100
                                if (byrJabatan > 6000000) {
                                    byrJabatan = 6000000
                                }
        
                                const gajiKurangJabatan = totalGajiSetahun - byrJabatan
                                let tarifMin = parseFloat(eleTarif.tarif_min)

                                if (parseFloat(eleTarif.tarif_min) !== 0) {
                                    tarifMin = parseFloat(eleTarif.tarif_min) - 1
                                }
                                
                                const gajiKurangPtkp = (gajiKurangJabatan - parseFloat(ele.nilai_setahun_ptkp))

                                if (eleTarif.tarif_group === 2 && eleTarif.tarif_type === "%") {
                                    if (gajiKurangPtkp >= parseFloat(eleTarif.tarif_min)) {
                                        const persenPtkp = parseFloat(eleTarif.tarif_val_max)
                                        let byrPph = ((parseFloat(gajiKurangPtkp) - tarifMin) * persenPtkp / 100) / 12
                                        
                                        let byrPphMax = 0
                                        if (gajiKurangPtkp >= parseFloat(eleTarif.tarif_max)) {
                                            byrPphMax = ((parseFloat(eleTarif.tarif_max) - tarifMin) * persenPtkp / 100) / 12 

                                            byrPph = byrPphMax
                                        }

                                        if (ptkpObj[ele.emp_number]['pajak'][eleTarif.tarif_name] === undefined) {
                                            ptkpObj[ele.emp_number]['pajak'][eleTarif.tarif_name] = {}
                                            ptkpObj[ele.emp_number]['pajak'][eleTarif.tarif_name]['karyawan'] = Math.round((byrPph * parseFloat(ele.byr_karyawan_ptkp) / 5))
                                            ptkpObj[ele.emp_number]['pajak'][eleTarif.tarif_name]['company'] = Math.round((byrPph * parseFloat(ele.byr_company_ptkp) / 5)) 
                                        }
                                        
                                        ptkpObj[ele.emp_number]['pajak']['pph21Karyawan'] += Math.round((byrPph * parseFloat(ele.byr_karyawan_ptkp) / 5))
                                        ptkpObj[ele.emp_number]['pajak']['pph21Company'] += Math.round((byrPph * parseFloat(ele.byr_company_ptkp) / 5))
                                    }
                                }
                            } else {
                                ptkpObj[ele.emp_number]['pajak']['limaPersen'] = 0
                                ptkpObj[ele.emp_number]['pajak']['limaPersenTahun'] = 0
                                ptkpObj[ele.emp_number]['pajak']['pph21Karyawan'] = 0
                                ptkpObj[ele.emp_number]['pajak']['pph21Company'] = 0
                            }
                        }
                    });
                }
            }
        }

        const getData = await reportModel.payroll(data)
        let resObj = {}

        let allGaji = 0
        let allPemotongan = 0
        let allCompany = 0
        let flagNotPotong = 0

        if (getData.status == 200 && getData.data.length > 0) {
            await getData.data.forEach(ele => {
                flagNotPotong = 0

                if (resObj[ele.emp_number] == undefined) {
                    resObj[ele.emp_number] = {}
                    resObj[ele.emp_number]['kasbon'] = []
                    resObj[ele.emp_number]['gajiBersih'] = parseFloat(ele.ebsal_basic_salary)
                    resObj[ele.emp_number]['namaKaryawan'] = ele.emp_firstname+" "+ele.emp_middle_name+" "+ele.emp_lastname
                    resObj[ele.emp_number]['namaSalary'] = ele.salary_component
                    resObj[ele.emp_number]['pemotongan'] = []

                    resObj[ele.emp_number]['totalPotongan'] = 0
                    resObj[ele.emp_number]['companyPotongan'] = 0
                    resObj[ele.emp_number]['pembulatan'] = 0
                    resObj[ele.emp_number]['gajiNett'] = parseFloat(ele.ebsal_basic_salary)
                    resObj[ele.emp_number]['gajiNettStatic'] = parseFloat(ele.ebsal_basic_salary)

                    allGaji += parseFloat(ele.ebsal_basic_salary)

                    const objDetail = {}
                    
                    if (ele.potongan_nilai != 0) {
                        if (ele.pemot_type == "%") {     
                            objDetail['debit'] = Math.round(convertBpjsKsRange(ele,dataBpjsKs) * ele.potongan_nilai / 100)                 
                            objDetail['company'] = 0
                        } else {
                            objDetail['debit'] = ele.potongan_nilai;
                            objDetail['company'] = 0
                        } 
                    } else {
                        if (ele.pemot_type == "%" && parseFloat(ele.pemot_byr_karyawan) != 0) {
                            objDetail['debit'] = Math.round(convertBpjsKsRange(ele,dataBpjsKs) * parseFloat(ele.pemot_byr_karyawan) / 100)
                        } else {
                            objDetail['debit'] = parseFloat(ele.pemot_byr_karyawan)
                        }

                        if (ele.pemot_type == "%" && parseFloat(ele.pemot_byr_company) != 0) {
                            objDetail['company'] = Math.round(convertBpjsKsRange(ele,dataBpjsKs) * parseFloat(ele.pemot_byr_company) / 100)
                        } else {
                            objDetail['company'] = parseFloat(ele.pemot_byr_company)
                        }
                    }

                    resObj[ele.emp_number]['totalPotongan'] += objDetail['debit'] + ptkpObj[ele.emp_number]['pajak']['pph21Karyawan']
                    resObj[ele.emp_number]['gajiNett'] -= objDetail['debit'] + ptkpObj[ele.emp_number]['pajak']['pph21Karyawan']
                    resObj[ele.emp_number]['companyPotongan'] += objDetail['company'] + ptkpObj[ele.emp_number]['pajak']['pph21Company']
                    resObj[ele.emp_number]['gajiNettStatic'] -= objDetail['debit'] + ptkpObj[ele.emp_number]['pajak']['pph21Karyawan']
                    
                    const pembulatanGaji = Math.round(resObj[ele.emp_number]['gajiNettStatic'] / 1000) * 1000 
                    const gajiTanpaPembulatan = Math.round(resObj[ele.emp_number]['gajiNettStatic'])

                    resObj[ele.emp_number]['gajiNett'] = pembulatanGaji
                    
                    if (resObj[ele.emp_number]['pembulatan'] === 0) {
                        resObj[ele.emp_number]['pembulatan'] = pembulatanGaji  - gajiTanpaPembulatan
                    }

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
                            objDetail['debit'] = Math.round(convertBpjsKsRange(ele,dataBpjsKs) * ele.potongan_nilai / 100)                    
                            objDetail['company'] = 0
                        } else {
                            objDetail['debit'] = ele.potongan_nilai;
                            objDetail['company'] = 0
                        }
                    } else {
                        if (ele.pemot_type == "%" && parseFloat(ele.pemot_byr_karyawan) != 0) {
                            objDetail['debit'] = Math.round(convertBpjsKsRange(ele,dataBpjsKs) * parseFloat(ele.pemot_byr_karyawan) / 100)
                        } else {
                            objDetail['debit'] = parseFloat(ele.pemot_byr_karyawan)
                        }

                        if (ele.pemot_type == "%" && parseFloat(ele.pemot_byr_company) != 0) {
                            objDetail['company'] = Math.round(convertBpjsKsRange(ele,dataBpjsKs) * parseFloat(ele.pemot_byr_company) / 100)
                        } else {
                            objDetail['company'] = parseFloat(ele.pemot_byr_company)
                        }
                    }

                    resObj[ele.emp_number]['totalPotongan'] += objDetail['debit']
                    resObj[ele.emp_number]['gajiNett'] -= objDetail['debit']
                    resObj[ele.emp_number]['companyPotongan'] += objDetail['company']

                    resObj[ele.emp_number]['gajiNettStatic'] -= objDetail['debit']
                    
                    const pembulatanGaji = Math.round(resObj[ele.emp_number]['gajiNettStatic'] / 1000) * 1000 
                    const gajiTanpaPembulatan = Math.round(resObj[ele.emp_number]['gajiNettStatic'])

                    resObj[ele.emp_number]['gajiNett'] = pembulatanGaji
                    
                    resObj[ele.emp_number]['pembulatan'] = pembulatanGaji  - gajiTanpaPembulatan

                    allGaji -= objDetail['debit']
                    allPemotongan += objDetail['debit']
                    allCompany += objDetail['company']

                    objDetail['namaPemotongan'] = ele.pemot_nama
                    objDetail['potongKeterangan'] = ele.emp_potong_keterangan
                    
                    resObj[ele.emp_number]['pemotongan'].push(objDetail)
                }
            });
        } 


        await dataKasbon.forEach(ele => {
            if (resObj[ele.kasbonEmp] !== undefined) {
                if (ele.bayarKasDate !== null) {
                    const splitKasbonDate = lib.formatDateDb(ele.bayarKasDate)
                    const kasbonDateMonth = splitKasbonDate.split("-")[1]
                    const kasbonDateYear = splitKasbonDate.split("-")[0]
                    if (data['bulan'] === kasbonDateMonth && data['tahun'] === kasbonDateYear) {
                        flagNotPotong = 0

                        resObj[ele.kasbonEmp]['kasbon'].push(ele)
                        resObj[ele.kasbonEmp]['totalPotongan'] = resObj[ele.kasbonEmp]['totalPotongan'] + parseFloat(ele.bayarKasJumlah)
                        allPemotongan += parseFloat(ele.bayarKasJumlah)
                        allGaji -= parseFloat(ele.bayarKasJumlah)
                        resObj[ele.kasbonEmp]['gajiNett'] =  Math.round((parseFloat(resObj[ele.kasbonEmp]['gajiNettStatic']) - parseFloat(ele.bayarKasJumlah)) / 1000) * 1000
                    }
                }
            }
        });

        resObj['allGaji'] = {}

        resObj['allGaji']['nett'] = Math.round(allGaji)

        resObj['allPemotongan'] = allPemotongan
        resObj['allCompany'] = allCompany

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

                    if (resObj['allGaji']['nett'] === 0) {
                        flagNotPotong = 1
                        resObj['allGaji']['pembulatan'] = 0
                    }
                    
                    const pembulatanGaji = Math.round((parseFloat(ele.ebsal_basic_salary) - ele.pajak.pph21Karyawan) / 1000) * 1000
                    const tanpaPembulatanGaji = Math.round(parseFloat(ele.ebsal_basic_salary) - ele.pajak.pph21Karyawan)

                    resObj[key]['gajiNett'] = pembulatanGaji
                    resObj[key]['gajiNettStatic'] = tanpaPembulatanGaji
                    resObj[key]['pembulatan'] = pembulatanGaji - tanpaPembulatanGaji
                    resObj[key]['pajak'] = ele.pajak

                    resObj['allGaji']['nett'] += parseFloat(resObj[key]['gajiNett'])
                    resObj['allGaji']['pembulatan'] += parseFloat(tanpaPembulatanGaji)
                    
                    resObj['allPemotongan'] += ele.pajak.pph21Karyawan
                    resObj['allCompany'] += ele.pajak.pph21Company
                } else {
                    resObj[key]['pajak'] = ele.pajak
                }
            }
        }

        const pembulatanAllGaji =  Math.round(resObj['allGaji']['nett'] / 1000) * 1000

        let pembulatanTanpaAllGaji =  Math.round(resObj['allGaji']['nett'])

        if (flagNotPotong === 1) {
            flagNotPotong = 0
            pembulatanTanpaAllGaji = Math.round(resObj['allGaji']['pembulatan'])
        }

        resObj['allGaji']['nett'] = pembulatanAllGaji
        resObj['allGaji']['pembulatan'] = pembulatanAllGaji - pembulatanTanpaAllGaji

        getData.data = resObj

        if (Object.keys(getData.data).length === 0) {
            getData.status = 400
            getData.message = "Data is empty"
            res.status(400).send(getData)
        } else {
            res.status(200).send(getData)
        }
    }
}

report.getSalaryEmp =  async (req, res, next) => {
    const { isAsuransi, isPajak, isKasbon, database, emp, tanggal} = req.body

    const getEmp = await employeeModel.getAllEmployeeSlipGajiById(req.body)

    if (getEmp === 0) {
        return res.status(400).send(getEmp)
    }

    const dateNow = lib.formatDateDb(new Date()).split("-")
    const dateIndo = dateNow[2]+" "+lib.convertMonthToNameIndo(dateNow[1])+" "+dateNow[0]

    const tglSplit = tanggal.split("-")

    const dataEmp = getEmp.data

    let postDataSalary = {}
    postDataSalary['database'] = database
    postDataSalary['emp'] = dataEmp.idEmp

    const getSalary = await employeeModel.getEmpSalaryById(postDataSalary)

    if (getSalary === 0) {
        return res.status(400).send(getSalary)
    }

    const dataSalary = getSalary.data

    let postDataSpv = {}
    postDataSpv['database'] = database
    postDataSpv['emp'] = dataEmp.idSupervisor

    const getSpv = await employeeModel.getNameEmployeeById(postDataSpv)

    let dataSpv = null
    
    if (getSpv !== 0) {
        dataSpv = getSpv.data
    }

    const getTarif = await tarifModel.getAll(req.body)
    
    let gajiEmp = {}
    let dataBpjsKs = {}
    
    if (getTarif != 200 && getTarif.data.length == 0) {
        res.status(400).send(getTarif)
    }

    let dataTarif = getTarif.data

    let objResult = {}
    objResult['pengurangan'] = {}
    objResult['profile'] = {}
    objResult['salary'] = {}
    objResult['spv'] = {}

    if (dataEmp.emp_middle_name !== "" && dataEmp.emp_lastname !== "") {
        objResult['profile']['name'] = dataEmp.emp_firstname
    } else if (dataEmp.emp_middle_name !== "") {
        objResult['profile']['name'] = dataEmp.emp_firstname+" "+dataEmp.emp_middle_name+" "+dataEmp.emp_lastname
    } else {
        objResult['profile']['name'] = dataEmp.emp_firstname+" "+dataEmp.emp_lastname
    }

    objResult['profile']['unit_name'] = (dataEmp.unitName === null ? "-" : dataEmp.unitName)
    objResult['profile']['unit_desk'] = (dataEmp.unitDeksripsi === null ? "-" : dataEmp.unitDeksripsi)
    objResult['profile']['job'] = (dataEmp.jobName === null ? "-" : dataEmp.jobName)
    objResult['profile']['ptkp'] = (dataEmp.statusPtkp === null ? "-" : dataEmp.statusPtkp)
    objResult['profile']['periode'] = lib.convertMonthToNameIndo(dateNow[1])+" "+dateNow[0]
    objResult['salary']['gaji'] = dataSalary.gaji
    objResult['salary']['deskripsi'] = dataSalary.salaryName

    if (dataSpv === null) {
        objResult['spv']['name'] = "-"
    } else {
        objResult['spv']['name'] = dataSpv.emp_firstname+" "+dataSpv.emp_middle_name+" "+dataSpv.emp_lastname
    }

    let tempPengurangan = {}

    tempPengurangan['pinjaman'] = 0
    tempPengurangan['bpjsKetenagakerjaan'] = 0
    tempPengurangan['bpjsKesehatan'] = 0
    tempPengurangan['pph21'] = 0
    tempPengurangan['Total'] = 0

    objResult['pengurangan'] = tempPengurangan

    if (isAsuransi) {
        const getPemotongan = await pemotonganModel.getAll(database)

        if (getPemotongan.data.length > 0) {
            //BPJS Kesehatan
            let tarifBpjs_ks = {}
            for (const key in dataTarif) {
                if (Object.hasOwnProperty.call(dataTarif, key)) {
                    const ele = dataTarif[key];
                    
                    if (ele.tarif_group === 1) {
                        tarifBpjs_ks = ele
                        break;
                    }
                }
            }

            let biayaBpjs_ks = parseFloat(dataSalary.gaji)
            if (parseFloat(dataSalary.gaji) < parseFloat(tarifBpjs_ks.tarif_min)) {
                biayaBpjs_ks = parseFloat(tarifBpjs_ks.tarif_val_min)
            } else if (parseFloat(dataSalary.gaji) > parseFloat(tarifBpjs_ks.tarif_max)) {
                biayaBpjs_ks = parseFloat(tarifBpjs_ks.tarif_val_max)
            }

            const dataPemotongan = getPemotongan.data

            for (const key in dataPemotongan) {
                if (Object.hasOwnProperty.call(dataPemotongan, key)) {
                    const ele = dataPemotongan[key];

                    if (ele.pemot_group === 1) {
                        const hasil = Math.round(biayaBpjs_ks * parseFloat(ele.pemot_byr_karyawan) / 100)
                        tempPengurangan['bpjsKesehatan'] += hasil
                        tempPengurangan['Total'] += hasil
                    } else if (ele.pemot_group === 2) {
                        const hasil = Math.round(parseFloat(dataSalary.gaji) * parseFloat(ele.pemot_byr_karyawan) / 100)
                        tempPengurangan['bpjsKetenagakerjaan'] += hasil
                        tempPengurangan['Total'] += hasil
                    }
                }
            }
        }
    } else {
        tempPengurangan['bpjsKetenagakerjaan'] = "-"
        tempPengurangan['bpjsKesehatan'] = "-"
    }

    if (isPajak) {
        let totalGajiSetahun = parseFloat(dataSalary.gaji) * 12
        for (const key in dataTarif) {
            if (Object.hasOwnProperty.call(dataTarif, key)) {
                const eleTarif = dataTarif[key];
                if (eleTarif.tarifRangeId !== 1) {
                    if (totalGajiSetahun >= parseFloat(dataEmp.nilaiPktp)) {
                        let byrJabatan = totalGajiSetahun * 5 /100
                        if (byrJabatan > 6000000) {
                            byrJabatan = 6000000
                        }

                        const gajiKurangJabatan = totalGajiSetahun - byrJabatan
                        let tarifMin = parseFloat(eleTarif.tarif_min)

                        if (parseFloat(eleTarif.tarif_min) !== 0) {
                            tarifMin = parseFloat(eleTarif.tarif_min) - 1
                        }
                        
                        const gajiKurangPtkp = (gajiKurangJabatan - parseFloat(dataEmp.nilaiPktp))

                        if (eleTarif.tarif_group === 2 && eleTarif.tarif_type === "%") {
                            if (gajiKurangPtkp >= parseFloat(eleTarif.tarif_min)) {
                                const persenPtkp = parseFloat(eleTarif.tarif_val_max)
                                let byrPph = ((parseFloat(gajiKurangPtkp) - tarifMin) * persenPtkp / 100) / 12
                                
                                let byrPphMax = 0
                                if (gajiKurangPtkp >= parseFloat(eleTarif.tarif_max)) {
                                    byrPphMax = ((parseFloat(eleTarif.tarif_max) - tarifMin) * persenPtkp / 100) / 12 

                                    byrPph = byrPphMax
                                }

                                const hasil = Math.round((byrPph * parseFloat(dataEmp.byrPtkp) / 5))
                                tempPengurangan['pph21'] += hasil
                                tempPengurangan['Total'] += hasil
                            }
                        }
                    }
                }
            }
        }
    } else {
        tempPengurangan['pph21'] = "-"
    }

    if (isKasbon) {
        let postKasbon = {}
        postKasbon['database'] = database
        postKasbon['emp'] = dataEmp.idEmp
        postKasbon['bulan'] = tglSplit[1]
        postKasbon['tahun'] = tglSplit[0]

        const getKasbon = await kasbonModel.getRincianEmpById(postKasbon)

        if (getKasbon.data.length > 0) {
            const dataKasbon = getKasbon.data
            for (const key in dataKasbon) {
                if (Object.hasOwnProperty.call(dataKasbon, key)) {
                    const ele = dataKasbon[key];
                    tempPengurangan['pinjaman'] += parseFloat(ele.bayarKasJumlah)
                    tempPengurangan['Total'] += parseFloat(ele.bayarKasJumlah)
                }
            }
        }
    } else {
        tempPengurangan['pinjaman'] = "-"
    }

    const gajiNett = parseFloat(dataSalary.gaji) - tempPengurangan['Total']
    const gajiNettBulat = Math.round(gajiNett / 1000) * 1000


    objResult['salary']['nett'] = Math.round(gajiNett / 1000) * 1000
    objResult['pembulatan'] = gajiNettBulat - gajiNett
    objResult['created_at'] = process.env.NAMA_KOTA+", "+dateIndo

    res.status(200).send(objResult)
}

report.getAbsensi =  async (req, res, next) => {
    const moment = require('moment-timezone'); 

    const { database, dateStart, dateEnd} = req.query

    const getReport = await absensiModel.report(req.query)

    if (getReport === 0) {
        return res.status(400).send(getReport)
    }

    const dataReport = getReport.data

    let arrDate = [] 
    let arrName = [] 

    for (const key in dataReport) {
        if (Object.hasOwnProperty.call(dataReport, key)) {
            const ele = dataReport[key];

            const dateHeader = moment.tz(ele.inTime, process.env.TIMEZONE).format("MMM DD")

            if (!arrDate.includes(dateHeader)) {
                arrDate.push(dateHeader)
            }

            if (!arrName.includes(ele.fullName)) {
                arrName.push(ele.fullName)
            }
        }
    }

    const getHoliday = await absensiModel.holidayAbsensi(req.query)

    const dataHoliday = getHoliday.data

    if (dataHoliday.length > 0) {
        for (const key in dataHoliday) {
            if (Object.hasOwnProperty.call(dataHoliday, key)) {
                const ele = dataHoliday[key];
                const dateHoliday = moment.tz(ele.holiDate, process.env.TIMEZONE).format("MMM DD")
                arrDate.push(dateHoliday)
            }
        }
    }

    let tempArrData = [] 

    arrName.forEach(name => {
        let dataArr = {}
        dataArr['nama'] = name
        arrDate.forEach(date => {
            dataArr[date.replace(" ","_")] = null
        });

        dataArr['total_waktu'] = 0
        dataArr['hari_kerja'] = 0

        tempArrData.push(dataArr)
    });

    for (const key in dataReport) {
        if (Object.hasOwnProperty.call(dataReport, key)) {
            const ele = dataReport[key];
            if (ele.inTime !== null && ele.outTime !== null) {
                const resDateIn = Date.parse(new Date(ele.inTime));
                const resDateOut = Date.parse(new Date(ele.outTime));
                const diffTime = resDateOut - resDateIn
 
                const getDiffTime = new Date(diffTime)
                const hourDiffTime = moment.utc(getDiffTime).format("HH.mm")
                const dateHeader = moment.tz(ele.inTime, process.env.TIMEZONE).format("MMM DD")

                tempArrData.forEach(eleArr => {
                    if (eleArr["nama"] === ele.fullName) {
                        eleArr[dateHeader.replace(" ","_")] = hourDiffTime
                    }
                });
            }
        }
    }
  
    for (const key in tempArrData) {
        if (Object.hasOwnProperty.call(tempArrData, key)) {
            const ele = tempArrData[key];
            for (const key1 in ele) {
                if (Object.hasOwnProperty.call(ele, key1)) {
                    const data = ele[key1];
                    if (key1 !== "nama" && key1 !== "hari_kerja" && key1 !== "total_waktu") {
                        if (data !== null) {
                            ele["hari_kerja"]++
                            ele["total_waktu"] += parseFloat(data)
                        } else {
                            ele[key1] = 0
                        }

                        if (dataHoliday.length > 0) {
                            for (const keyHoliday in dataHoliday) {
                                if (Object.hasOwnProperty.call(dataHoliday, keyHoliday)) {
                                    const eleHoliday = dataHoliday[keyHoliday];
                                    const dateHoliday = moment.tz(eleHoliday.holiDate, process.env.TIMEZONE).format("MMM DD")
                                    if (key1 === dateHoliday.replace(" ","_")) {
                                        ele[key1] = "Holiday"
                                        ele["hari_kerja"]++
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    let objResult = {}
    objResult['status'] = 200
    objResult['message'] = "Data berhasil di proses"
    objResult['data'] = tempArrData
    
    if (tempArrData.length === 0) {
        objResult['status'] = 400
        objResult['message'] = "Data tidak tersedia"
        res.status(400).send(objResult)
    } else {
        res.status(200).send(objResult)
    }
}

report.getAbsensiTable =  async (req, res, next) => {
    const moment = require('moment-timezone'); 

    const { database, dateStart, dateEnd} = req.query

    const getReport = await absensiModel.report(req.query)

    if (getReport === 0) {
        return res.status(400).send(getReport)
    }

    const dataReport = getReport.data

    let arrDate = [] 
    let arrName = [] 

    for (const key in dataReport) {
        if (Object.hasOwnProperty.call(dataReport, key)) {
            const ele = dataReport[key];

            const dateHeader = moment.tz(ele.inTime, process.env.TIMEZONE).format("MMM DD")

            if (!arrDate.includes(dateHeader)) {
                arrDate.push(dateHeader)
            }

            if (!arrName.includes(ele.idEmp)) {
                arrName.push(ele.idEmp)
            }
        }
    }

    const getHoliday = await absensiModel.holidayAbsensi(req.query)

    const dataHoliday = getHoliday.data

    if (dataHoliday.length > 0) {
        for (const key in dataHoliday) {
            if (Object.hasOwnProperty.call(dataHoliday, key)) {
                const ele = dataHoliday[key];
                const dateHoliday = moment.tz(ele.holiDate, process.env.TIMEZONE).format("MMM DD")
                arrDate.push(dateHoliday)
            }
        }
    }

    let tempArrData = [] 

    arrName.forEach(name => {
        let dataArr = {}
        dataArr['id'] = name
        arrDate.forEach(date => {
            dataArr[date.replace(" ","_")] = null
        });

        dataArr['hari_kerja'] = 0

        tempArrData.push(dataArr)
    });

    for (const key in dataReport) {
        if (Object.hasOwnProperty.call(dataReport, key)) {
            const ele = dataReport[key];
            if (ele.inTime !== null && ele.outTime !== null) {
                const resDateIn = Date.parse(new Date(ele.inTime));
                const resDateOut = Date.parse(new Date(ele.outTime));
                const diffTime = resDateOut - resDateIn
                
                const getDiffTime = new Date(diffTime)
                const hourDiffTime = moment.utc(getDiffTime).format("HH.mm")
                const dateHeader = moment.tz(ele.inTime, process.env.TIMEZONE).format("MMM DD")

                tempArrData.forEach(eleArr => {
                    if (eleArr["id"] === ele.idEmp) {
                        eleArr[dateHeader.replace(" ","_")] = hourDiffTime
                    }
                });
            }
        }
    }
  
    for (const key in tempArrData) {
        if (Object.hasOwnProperty.call(tempArrData, key)) {
            const ele = tempArrData[key];
            for (const key1 in ele) {
                if (Object.hasOwnProperty.call(ele, key1)) {
                    const data = ele[key1];
                    if (key1 !== "id" && key1 !== "hari_kerja" && key1 !== "total_waktu") {
                        if (data !== null) {
                            ele["hari_kerja"]++
                            // ele["total_waktu"] += parseFloat(data)
                        } else {
                            ele[key1] = 0
                        }

                        if (dataHoliday.length > 0) {
                            for (const keyHoliday in dataHoliday) {
                                if (Object.hasOwnProperty.call(dataHoliday, keyHoliday)) {
                                    const eleHoliday = dataHoliday[keyHoliday];
                                    const dateHoliday = moment.tz(eleHoliday.holiDate, process.env.TIMEZONE).format("MMM DD")
                                    if (key1 === dateHoliday.replace(" ","_")) {
                                        ele[key1] = "Holiday"
                                        ele["hari_kerja"]++
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    let objResult = {}
    objResult['status'] = 200
    objResult['message'] = "Data berhasil di proses"
    objResult['data'] = tempArrData
    
    if (tempArrData.length === 0) {
        objResult['status'] = 400
        objResult['message'] = "Data tidak tersedia"
        res.status(400).send(objResult)
    } else {
        res.status(200).send(objResult)
    }
}

module.exports = report;