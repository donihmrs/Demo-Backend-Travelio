const path = require('path');
const appDir = path.dirname(require.main.filename);
const token = require(appDir+'/controller/token')
const lib = require(appDir+'/controller/lib')
const axios = require('axios');
const { get } = require('http');

const reportModel = require(appDir+'/model/reportModel')
const ptkpModel = require(appDir+'/model/ptkpModel')
const tarifModel = require(appDir+'/model/tarifModel')
const absensiModel = require(appDir+'/model/absensiModel')

const report = {}

function convertBpjsKsRange(ele, bpjsKs) {
    let byrBpjsKesehatan = parseInt(ele.ebsal_basic_salary)

    //BPJS KESEHATAN
    if (ele.pemotongan_id === 1) {
        if (parseInt(ele.ebsal_basic_salary) <= parseInt(bpjsKs.tarif_min)) {
            byrBpjsKesehatan = parseInt(bpjsKs.tarif_val_min)
        } else if (parseInt(ele.ebsal_basic_salary) >= parseInt(bpjsKs.tarif_max)) {
            byrBpjsKesehatan = parseInt(bpjsKs.tarif_val_max)
        }
    }

    return parseInt(byrBpjsKesehatan)
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

    const dataHoliday = await absensiModel.holiday(data)

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
                            if (totalGajiSetahun >= parseInt(ele.nilai_setahun_ptkp)) {
                                let byrJabatan = totalGajiSetahun * 5 /100
                                if (byrJabatan > 6000000) {
                                    byrJabatan = 6000000
                                }
        
                                const gajiKurangJabatan = totalGajiSetahun - byrJabatan
                                let tarifMin = parseInt(eleTarif.tarif_min)

                                if (parseInt(eleTarif.tarif_min) !== 0) {
                                    tarifMin = parseInt(eleTarif.tarif_min) - 1
                                }
                                
                                const gajiKurangPtkp = (gajiKurangJabatan - parseInt(ele.nilai_setahun_ptkp)) - tarifMin
                                
                                if (eleTarif.tarif_group === 2 && eleTarif.tarif_type === "%") {
                                    if (gajiKurangPtkp >= parseInt(eleTarif.tarif_min)) {
                                        const persenPtkp = parseFloat(eleTarif.tarif_val_max)
                                        let byrPph = (gajiKurangPtkp * persenPtkp / 100) / 12
                                        
                                        let byrPphMax = 0
                                        if (gajiKurangPtkp >= parseInt(eleTarif.tarif_max)) {
                                            byrPphMax = ((parseInt(eleTarif.tarif_max) - tarifMin) * persenPtkp / 100) / 12 

                                            if (byrPphMax < byrPph) {
                                                byrPph = byrPphMax
                                            }
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
    
    if (getPtkp.status != 200 && getPtkp.data.length == 0) {
        res.status(400).send(getPtkp)
    } else {
        const dataPtkp = getPtkp.data

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
        
        let objTotal = {}
        objTotal['gajiBruto'] = 0
        objTotal['asuransiKaryawan_ks'] = 0
        objTotal['asuransiKaryawan_kt'] = 0
        objTotal['asuransiCompany_ks'] = 0
        objTotal['asuransiCompany_kt'] = 0
        objTotal['pajakKaryawan'] = 0
        objTotal['pajakCompany'] = 0
        objTotal['pembulatan'] = 0
        objTotal['emp'] = {}

        //Hitung pajak
        for (const key in dataPtkp) {
            if (Object.hasOwnProperty.call(dataPtkp, key)) {
                const ele = dataPtkp[key];
                if (ptkpObj[ele.emp_number] == undefined) {
                    ptkpObj[ele.emp_number] = {}
                    ptkpObj[ele.emp_number]['ebsal_basic_salary'] = ele.ebsal_basic_salary
                    ptkpObj[ele.emp_number]['pajak'] = {}

                    const totalGajiSetahun = ele.ebsal_basic_salary * 12
                    if (totalGajiSetahun >= parseInt(ele.nilai_setahun_ptkp)) {
                        let byrJabatan = totalGajiSetahun * 5 /100
                        if (byrJabatan > 6000000) {
                            byrJabatan = 6000000
                        }

                        const gajiKurangJabatan = totalGajiSetahun - byrJabatan
                        const gajiKurangPtkp = gajiKurangJabatan - parseInt(ele.nilai_setahun_ptkp)

                        let sumPpn = 0
                        await dataTarif.forEach(ele => {
                            if (ele.tarif_group === 2 && ele.tarif_type === "%") {
                                if (gajiKurangPtkp >= ele.tarif_min) {
                                    const persenPtkp = parseInt(ele.tarif_val_max)
                                    sumPpn += (gajiKurangPtkp * persenPtkp / 100) / 12
                                }
                            }

                            if (ele.tarifRangeId === 1) {
                                dataBpjsKs = ele
                            }
                        });

                        ptkpObj[ele.emp_number]['pajak']['pph21Karyawan'] = (sumPpn * ele.byr_karyawan_ptkp / 5)
                        ptkpObj[ele.emp_number]['pajak']['pph21Company'] = (sumPpn * ele.byr_company_ptkp / 5)

                        objTotal['pajakKaryawan'] += (sumPpn * ele.byr_karyawan_ptkp / 5)
                        objTotal['pajakCompany'] += (sumPpn * ele.byr_company_ptkp / 5) 

                    } else {
                        ptkpObj[ele.emp_number]['pajak']['pph21Karyawan'] = 0
                        ptkpObj[ele.emp_number]['pajak']['pph21Company'] = 0
                    }
                }
            }
        }

        const getData = await reportModel.payroll(data)
        let resObj = {}
        let allGaji = 0

        if (getData.status == 200 && getData.data.length > 0) {
            getData.data.forEach(ele => {
                if (resObj[ele.emp_number] == undefined) {
                    resObj[ele.emp_number] = {}
                    resObj[ele.emp_number]['gajiNett'] = parseInt(ele.ebsal_basic_salary)
                    objTotal['gajiBruto'] += parseInt(ele.ebsal_basic_salary)
                    allGaji += parseInt(ele.ebsal_basic_salary)

                    const objDetail = {}
                    let byrBpjsKesehatan = parseInt(ele.ebsal_basic_salary)

                    if (parseInt(ele.ebsal_basic_salary) <= parseInt(dataBpjsKs.tarif_min)) {
                        byrBpjsKesehatan = parseInt(dataBpjsKs.tarif_val_min)
                    } else if (parseInt(ele.ebsal_basic_salary) >= parseInt(dataBpjsKs.tarif_max)) {
                        byrBpjsKesehatan = parseInt(dataBpjsKs.tarif_val_max)
                    }

                    if (ele.potongan_nilai != 0) {
                        if (ele.pemot_type == "%") {
                            objDetail['debit'] = ele.ebsal_basic_salary * ele.potongan_nilai / 100    
                            if (ele.pemot_group == 1) {
                                objTotal['asuransiKaryawan_ks'] += byrBpjsKesehatan * ele.potongan_nilai / 100    
                                objTotal['asuransiCompany_ks'] += 0
                            } else if (ele.pemot_group == 2) {
                                objTotal['asuransiKaryawan_kt'] += ele.ebsal_basic_salary * ele.potongan_nilai / 100    
                                objTotal['asuransiCompany_kt'] += 0
                            } else {
                                const pemotNama = ele.pemot_nama
                                if (objTotal['emp'][ele.emp_number] == undefined) {
                                    objTotal['emp'][ele.emp_number] = {}
                                    objTotal['emp'][ele.emp_number]['id'] = ele.employee_id
                                    objTotal['emp'][ele.emp_number]['namaKaryawan'] = ele.emp_firstname+" "+ele.emp_middle_name+" "+ele.emp_lastname
                                }

                                if (objTotal['emp'][ele.emp_number][pemotNama.replace(/ /g,"_")] == undefined) {
                                    objTotal['emp'][ele.emp_number][pemotNama.replace(/ /g,"_")] = ele.ebsal_basic_salary * ele.potongan_nilai / 100
                                } else {
                                    objTotal['emp'][ele.emp_number][pemotNama.replace(/ /g,"_")] += ele.ebsal_basic_salary * ele.potongan_nilai / 100
                                }
                            }
                        } else {
                            objDetail['debit'] = ele.potongan_nilai;

                            if (ele.pemot_group == 1) {
                                objTotal['asuransiKaryawan_ks'] += ele.potongan_nilai  
                                objTotal['asuransiCompany_ks'] += 0
                            } else if (ele.pemot_group == 2) {
                                objTotal['asuransiKaryawan_kt'] += ele.potongan_nilai    
                                objTotal['asuransiCompany_kt'] += 0
                            } else {
                                const pemotNama = ele.pemot_nama
                                if (objTotal['emp'][ele.emp_number] == undefined) {
                                    objTotal['emp'][ele.emp_number] = {}
                                    objTotal['emp'][ele.emp_number]['id'] = ele.employee_id
                                    objTotal['emp'][ele.emp_number]['namaKaryawan'] = ele.emp_firstname+" "+ele.emp_middle_name+" "+ele.emp_lastname
                                }

                                if (objTotal['emp'][ele.emp_number][pemotNama.replace(/ /g,"_")] == undefined) {
                                    objTotal['emp'][ele.emp_number][pemotNama.replace(/ /g,"_")] = ele.potongan_nilai
                                } else {
                                    objTotal['emp'][ele.emp_number][pemotNama.replace(/ /g,"_")] += ele.potongan_nilai
                                }
                            }
                        } 
                    } else {
                        if (ele.pemot_type == "%" && parseInt(ele.pemot_byr_karyawan) != 0) {
                            objDetail['debit'] = ele.ebsal_basic_salary * parseInt(ele.pemot_byr_karyawan) / 100
                            
                            if (ele.pemot_group == 1) {
                                objTotal['asuransiKaryawan_ks'] += byrBpjsKesehatan * parseInt(ele.pemot_byr_karyawan) / 100    
                            } else if (ele.pemot_group == 2) {
                                objTotal['asuransiKaryawan_kt'] += ele.ebsal_basic_salary * parseInt(ele.pemot_byr_karyawan) / 100    
                            } else {
                                const pemotNama = ele.pemot_nama

                                if (objTotal['emp'][ele.emp_number] == undefined) {
                                    objTotal['emp'][ele.emp_number] = {}
                                    objTotal['emp'][ele.emp_number]['id'] = ele.employee_id
                                    objTotal['emp'][ele.emp_number]['namaKaryawan'] = ele.emp_firstname+" "+ele.emp_middle_name+" "+ele.emp_lastname
                                }

                                if (objTotal['emp'][ele.emp_number][pemotNama.replace(/ /g,"_")] == undefined) {
                                    objTotal['emp'][ele.emp_number][pemotNama.replace(/ /g,"_")] = ele.ebsal_basic_salary * ele.pemot_byr_karyawan / 100
                                } else {
                                    objTotal['emp'][ele.emp_number][pemotNama.replace(/ /g,"_")] += ele.ebsal_basic_salary * ele.pemot_byr_karyawan / 100
                                }
                            }

                        } else {
                            objDetail['debit'] = parseInt(ele.pemot_byr_karyawan)
                            if (ele.pemot_group == 1) {
                                objTotal['asuransiKaryawan_ks'] += parseInt(ele.pemot_byr_karyawan)    
                            } else if (ele.pemot_group == 2) {
                                objTotal['asuransiKaryawan_kt'] += parseInt(ele.pemot_byr_karyawan)
                            } else {
                                const pemotNama = ele.pemot_nama
                                if (objTotal['emp'][ele.emp_number] == undefined) {
                                    objTotal['emp'][ele.emp_number] = {}
                                    objTotal['emp'][ele.emp_number]['id'] = ele.employee_id
                                    objTotal['emp'][ele.emp_number]['namaKaryawan'] = ele.emp_firstname+" "+ele.emp_middle_name+" "+ele.emp_lastname
                                }

                                if (objTotal['emp'][ele.emp_number][pemotNama.replace(/ /g,"_")] == undefined) {
                                    objTotal['emp'][ele.emp_number][pemotNama.replace(/ /g,"_")] = ele.pemot_byr_karyawan
                                } else {
                                    objTotal['emp'][ele.emp_number][pemotNama.replace(/ /g,"_")] += ele.pemot_byr_karyawan
                                }
                            }
                        }

                        if (ele.pemot_type == "%" && parseInt(ele.pemot_byr_company) != 0) {
                            if (ele.pemot_group == 1) {
                                objTotal['asuransiCompany_ks'] += byrBpjsKesehatan * parseFloat(ele.pemot_byr_company) / 100    
                            } else if (ele.pemot_group == 2) {
                                objTotal['asuransiCompany_kt'] += ele.ebsal_basic_salary * parseFloat(ele.pemot_byr_company) / 100    
                            }
                        } else {
                            if (ele.pemot_group == 1) {
                                objTotal['asuransiCompany_ks'] += parseInt(ele.pemot_byr_company)    
                            } else if (ele.pemot_group == 2) {
                                objTotal['asuransiCompany_kt'] += parseInt(ele.pemot_byr_company)    
                            }
                        }
                    }

                    resObj[ele.emp_number]['gajiNett'] -= objDetail['debit'] + ptkpObj[ele.emp_number]['pajak']['pph21Karyawan'] 

                    objTotal['pembulatan'] += (Math.round(resObj[ele.emp_number]['gajiNett'] / 1000) * 1000) - resObj[ele.emp_number]['gajiNett']

                    resObj[ele.emp_number]['gajiNett'] = Math.round(resObj[ele.emp_number]['gajiNett'] / 1000) * 1000
                    allGaji -= objDetail['debit'] + ptkpObj[ele.emp_number]['pajak']['pph21Karyawan']
                } else {
                    const objDetail = {}
                    if (ele.potongan_nilai != 0) {
                        if (ele.pemot_type == "%") {
                            objDetail['debit'] = ele.ebsal_basic_salary * ele.potongan_nilai / 100   
                            
                            if (ele.pemot_group == 1) {
                                objTotal['asuransiKaryawan_ks'] += byrBpjsKesehatan * ele.potongan_nilai / 100    
                                objTotal['asuransiCompany_ks'] += 0
                            } else if (ele.pemot_group == 2) {
                                objTotal['asuransiKaryawan_kt'] += ele.ebsal_basic_salary * ele.potongan_nilai / 100    
                                objTotal['asuransiCompany_kt'] += 0
                            } else {
                                const pemotNama = ele.pemot_nama
                                if (objTotal['emp'][ele.emp_number] == undefined) {
                                    objTotal['emp'][ele.emp_number] = {}
                                    objTotal['emp'][ele.emp_number]['id'] = ele.employee_id
                                    objTotal['emp'][ele.emp_number]['namaKaryawan'] = ele.emp_firstname+" "+ele.emp_middle_name+" "+ele.emp_lastname
                                }

                                if (objTotal['emp'][ele.emp_number][pemotNama.replace(/ /g,"_")] == undefined) {
                                    objTotal['emp'][ele.emp_number][pemotNama.replace(/ /g,"_")] = ele.ebsal_basic_salary * ele.potongan_nilai / 100
                                } else {
                                    objTotal['emp'][ele.emp_number][pemotNama.replace(/ /g,"_")] += ele.ebsal_basic_salary * ele.potongan_nilai / 100
                                }
                            }
                        } else {
                            objDetail['debit'] = ele.potongan_nilai;

                            if (ele.pemot_group == 1) {
                                objTotal['asuransiKaryawan_ks'] += ele.potongan_nilai  
                                objTotal['asuransiCompany_ks'] += 0
                            } else if (ele.pemot_group == 2) {
                                objTotal['asuransiKaryawan_kt'] += ele.potongan_nilai  
                                objTotal['asuransiCompany_kt'] += 0
                            } else {
                                const pemotNama = ele.pemot_nama
                                if (objTotal['emp'][ele.emp_number] == undefined) {
                                    objTotal['emp'][ele.emp_number] = {}
                                    objTotal['emp'][ele.emp_number]['id'] = ele.employee_id
                                    objTotal['emp'][ele.emp_number]['namaKaryawan'] = ele.emp_firstname+" "+ele.emp_middle_name+" "+ele.emp_lastname
                                }

                                if (objTotal['emp'][ele.emp_number][pemotNama.replace(/ /g,"_")] == undefined) {
                                    objTotal['emp'][ele.emp_number][pemotNama.replace(/ /g,"_")] = ele.potongan_nilai
                                } else {
                                    objTotal['emp'][ele.emp_number][pemotNama.replace(/ /g,"_")] += ele.potongan_nilai
                                }
                            }
                        }
                    } else {
                        if (ele.pemot_type == "%" && parseFloat(ele.pemot_byr_karyawan) != 0) {
                            objDetail['debit'] = ele.ebsal_basic_salary * parseFloat(ele.pemot_byr_karyawan) / 100

                            if (ele.pemot_group == 1) {
                                objTotal['asuransiKaryawan_ks'] += byrBpjsKesehatan * parseInt(ele.pemot_byr_karyawan) / 100    
                            } else if (ele.pemot_group == 2) {
                                objTotal['asuransiKaryawan_kt'] += ele.ebsal_basic_salary * parseInt(ele.pemot_byr_karyawan) / 100    
                            } else {
                                const pemotNama = ele.pemot_nama

                                if (objTotal['emp'][ele.emp_number] == undefined) {
                                    objTotal['emp'][ele.emp_number] = {}
                                    objTotal['emp'][ele.emp_number]['id'] = ele.employee_id
                                    objTotal['emp'][ele.emp_number]['namaKaryawan'] = ele.emp_firstname+" "+ele.emp_middle_name+" "+ele.emp_lastname
                                }

                                if (objTotal['emp'][ele.emp_number][pemotNama.replace(/ /g,"_")] == undefined) {
                                    objTotal['emp'][ele.emp_number][pemotNama.replace(/ /g,"_")] = ele.ebsal_basic_salary * ele.pemot_byr_karyawan / 100
                                } else {
                                    objTotal['emp'][ele.emp_number][pemotNama.replace(/ /g,"_")] += ele.ebsal_basic_salary * ele.pemot_byr_karyawan / 100
                                }
                            }

                        } else {
                            objDetail['debit'] = parseFloat(ele.pemot_byr_karyawan)

                            if (ele.pemot_group == 1) {
                                objTotal['asuransiKaryawan_ks'] += parseInt(ele.pemot_byr_karyawan)    
                            } else if (ele.pemot_group == 2) {
                                objTotal['asuransiKaryawan_kt'] += parseInt(ele.pemot_byr_karyawan)    
                            } else {
                                const pemotNama = ele.pemot_nama
                                if (objTotal['emp'][ele.emp_number] == undefined) {
                                    objTotal['emp'][ele.emp_number] = {}
                                    objTotal['emp'][ele.emp_number]['id'] = ele.employee_id
                                    objTotal['emp'][ele.emp_number]['namaKaryawan'] = ele.emp_firstname+" "+ele.emp_middle_name+" "+ele.emp_lastname
                                }

                                if (objTotal['emp'][ele.emp_number][pemotNama.replace(/ /g,"_")] == undefined) {
                                    objTotal['emp'][ele.emp_number][pemotNama.replace(/ /g,"_")] = ele.pemot_byr_karyawan
                                } else {
                                    objTotal['emp'][ele.emp_number][pemotNama.replace(/ /g,"_")] += ele.pemot_byr_karyawan
                                }
                            }
                        }

                        if (ele.pemot_type == "%" && parseFloat(ele.pemot_byr_company) != 0) {
                            if (ele.pemot_group == 1) {
                                objTotal['asuransiCompany_ks'] += byrBpjsKesehatan * parseFloat(ele.pemot_byr_company) / 100    
                            } else if (ele.pemot_group == 2) {
                                objTotal['asuransiCompany_kt'] += ele.ebsal_basic_salary * parseFloat(ele.pemot_byr_company) / 100    
                            }
                        } else {
                            if (ele.pemot_group == 1) {
                                objTotal['asuransiCompany_ks'] += parseInt(ele.pemot_byr_company)    
                            } else if (ele.pemot_group == 2) {
                                objTotal['asuransiCompany_kt'] += parseInt(ele.pemot_byr_company)    
                            }
                        }
                    }

                    
                    resObj[ele.emp_number]['gajiNett'] -= objDetail['debit']     
                    
                    objTotal['pembulatan'] += (Math.round(resObj[ele.emp_number]['gajiNett'] / 1000) * 1000) - resObj[ele.emp_number]['gajiNett']
                    resObj[ele.emp_number]['gajiNett'] = Math.round(resObj[ele.emp_number]['gajiNett'] / 1000) * 1000
                    allGaji -= objDetail['debit']
                }
            });

            allGaji = Math.round(allGaji / 1000) * 1000
        } 

        objTotal['gajiNett'] = 0
        
        for (const key in ptkpObj) {
            if (Object.hasOwnProperty.call(ptkpObj, key)) {
                const ele = ptkpObj[key];
                if (resObj[key] == undefined) {
                    allGaji += parseInt(ele.ebsal_basic_salary) - ele.pajak.pph21Karyawan
                    objTotal['gajiBruto'] += parseInt(ele.ebsal_basic_salary)
                }
            }
        }

        objTotal['gajiNett'] = allGaji

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

module.exports = report;