const path = require('path');
const appDir = path.dirname(require.main.filename);
const token = require(appDir+'/controller/token')
const lib = require(appDir+'/controller/lib')

const employeeModel = require(appDir+'/model/employeeModel')
const bahasaModel = require(appDir+'/model/bahasaModel')
const skillModel = require(appDir+'/model/skillModel')
const absensiModel = require(appDir+'/model/absensiModel')
const jobModel = require(appDir+'/model/jobModel')
const kasbonModel = require(appDir+'/model/kasbonModel')

const karyawan = {}

karyawan.addKandidat = async (req, res, next) => {
    try {
        const nameDatabase = req.body.database
        let lastIdEmployee = 0
        let namaKaryawanForm = ""

        if (req.body.biodata.nama == "") {
            res.status(400).send({
                status:400,
                data:{},
                message:"Form Nama karyawan belum terisi"
            })
        } else {
            const nama = req.body.biodata.nama
            namaKaryawanForm = nama

            const tempatLahir = req.body.biodata.tempatLahir
            //tanggalLahir ada object {year, month, day}
            const tanggalLahir = req.body.biodata.tanggalLahir

            const agama = req.body.biodata.agama
            const kelamin = req.body.biodata.kelamin
            const umur = req.body.biodata.umur
            const alamatKtp = req.body.biodata.alamatKtp
            const alamatDomisili = req.body.biodata.alamatDomisili
            const noKtp = req.body.biodata.noKtp
            const npwp = req.body.biodata.npwp
            const statusPribadi = req.body.biodata.status
            const namaBank = req.body.biodata.namaBank
            const namaRekening = req.body.biodata.namaRekening
            const noRekening = req.body.biodata.noRekening
            const noHp = req.body.biodata.noHp
            const sim = req.body.biodata.sim
            const jenisSim = req.body.biodata.jenisSim
            const kendaraan = req.body.biodata.kendaraan
            const jenisKendaraan = req.body.biodata.jenisKendaraan
        
            let data = {}

            data['database'] = nameDatabase

            const namaArray = nama.split(" ");
            if (namaArray.length > 2) {
                data['namaTengah'] = namaArray[1]
                data['namaAkhir'] = namaArray[2]
            } else {
                data['namaTengah'] = ""
                data['namaAkhir'] = namaArray[1]
            }

            data['namaDepan'] = namaArray[0]
            data['tempatLahir'] = tempatLahir
            data['tanggalLahir'] = tanggalLahir.year +'-'+ lib.dateMonth(tanggalLahir.month) +'-'+ lib.dateDay(tanggalLahir.day)
            data['agama'] = agama
            data['kelamin'] = parseInt(kelamin)
            data['umur'] = umur
            data['alamatKtp'] = alamatKtp
            data['alamatDomisili'] = alamatDomisili
            data['noKtp'] = noKtp
            data['npwp'] = npwp
            data['status'] = statusPribadi
            data['namaBank'] = namaBank
            data['namaRekening'] = namaRekening
            data['noRekening'] = noRekening
            data['noHp'] = noHp
            data['sim'] = sim
            data['jenisSim'] = jenisSim
            data['kendaraan'] = kendaraan
            data['jenisKendaraan'] = jenisKendaraan
            data['statusKaryawan'] = 2

            let id_emp = "00001";
            const getEmpLastId = await employeeModel.lastEmployeeId(nameDatabase)
            if (getEmpLastId.status == 200) {
                id_emp = getEmpLastId.data.toString()
            }

            data['emp_id'] = id_emp;

            lastIdEmployee = await employeeModel.insertLastId(data)

            if (lastIdEmployee.status != 200) {
                res.status(400).send({
                    status:400,
                    data:{},
                    message:"Fail, Anda gagal menginput data"
                })
            }

            lastIdEmployee = lastIdEmployee.data
        }

        if (req.body.kerja !== undefined) {

            let data = {}

            data['database'] = nameDatabase

            //pada tanggal masuk ada object {year, month, day}
            const tanggal = req.body.kerja.tanggalMasuk

            const posisi = req.body.kerja.posisiTerakhir
            const gajiTerakhir = req.body.kerja.gajiTerakhir
            const gajiDiharapkan = req.body.kerja.gajiDiharapkan

            data['id_emp'] = lastIdEmployee
            data['tgl_masuk'] = tanggal.year +'-'+ lib.dateMonth(tanggal.month) +'-'+ lib.dateDay(tanggal.day)
            data['jabatan'] = posisi
            data['gajiTerakhir'] = gajiTerakhir
            data['gajiDiharapkan'] = gajiDiharapkan

            await employeeModel.insertLamaran(data)
        }

        if (req.body.bahasa.length > 0) {
            req.body.bahasa.forEach(async ele => {
                const namaBahasa = ele.nama
                const berBahasa = ele.berbicara
                const menuBahasa = ele.menulis
                const mendBahasa = ele.mendengarkan
                const bacaBahasa = ele.membaca

                let data = {}
                data['database'] = nameDatabase;
                data['nama'] = lib.capitalFirstText(namaBahasa);
                data['id_emp'] = lastIdEmployee

                await bahasaModel.getIdBahasa(data).then(async (idBahasa) => {
                    if (idBahasa.data == 0) {
                        idBahasa = await bahasaModel.insertLastId(data)
                    } 

                    data['id_bahasa'] = idBahasa.data;

                    //Menulis = 1
                    //Berbicara = 2
                    //Membaca = 3
                    //Mendengarkan = 4

                    if (menuBahasa !== undefined) {
                        data['type'] = 1
                        data['kompeten'] = lib.convertBahasaToId(menuBahasa);
                        await employeeModel.insertBahasa(data)
                    }

                    if (berBahasa !== undefined) {
                        data['type'] = 2
                        data['kompeten'] = lib.convertBahasaToId(berBahasa);
                        await employeeModel.insertBahasa(data)
                    }

                    if (mendBahasa !== undefined) {
                        data['type'] = 3
                        data['kompeten'] = lib.convertBahasaToId(bacaBahasa);
                        await employeeModel.insertBahasa(data)
                    }

                    if (mendBahasa !== undefined) {
                        data['type'] = 4
                        data['kompeten'] = lib.convertBahasaToId(mendBahasa);
                        await employeeModel.insertBahasa(data)
                    }
                })
            });
        }

        if (req.body.keahlian.length > 0) {
            req.body.keahlian.forEach(async ele => {
                const keahlian = ele

                let data = {}
                data['database'] = nameDatabase;
                data['nama'] = keahlian;
                data['id_emp'] = lastIdEmployee

                await skillModel.getIdName(data).then(async (idSkill) => {
                    if (idSkill.data == 0) {
                        idSkill = await skillModel.insertLastId(data)
                    } 

                    data['id_skill'] = idSkill.data;

                    await employeeModel.insertSkill(data)
                })
            });
        }

        let dataKeluarga = {}

        dataKeluarga['database'] = nameDatabase;
        dataKeluarga['form'] = []

        if (req.body.keluarga.anak.length > 0) {
            let tempKeluarga = []

            req.body.keluarga.anak.forEach(async ele => {
                const nama = ele.nama
                const tempat = ele.tempatLahir

                //pada tanggal ada object {year, month, day}
                const tanggal = ele.tanggalLahir

                const kelamin = ele.kelamin
                const pendidikan = ele.pendidikan
                const pekerjaan = ele.pekerjaan
                
                const tglLahir = tanggal.year +'-'+ lib.dateMonth(tanggal.month) +'-'+ lib.dateDay(tanggal.day)

                tempKeluarga = [lastIdEmployee,dataKeluarga['form'].length + 1,nama,"other","Anak",tglLahir
                                    ,tempat,parseInt(kelamin),pendidikan.toUpperCase(),pekerjaan]

                dataKeluarga['form'].push(tempKeluarga)
            });
        }

        if (req.body.keluarga.ayah.nama != "") {
            let tempKeluarga = []

            const nama = req.body.keluarga.ayah.nama
            const tempat = req.body.keluarga.ayah.tempatLahir

            //pada tanggal ada object {year, month, day}
            const tanggal = req.body.keluarga.ayah.tanggalLahir

            const kelamin = req.body.keluarga.ayah.kelamin
            const pendidikan = req.body.keluarga.ayah.pendidikan
            const pekerjaan = req.body.keluarga.ayah.pekerjaan

            const tglLahir = tanggal.year +'-'+ lib.dateMonth(tanggal.month) +'-'+ lib.dateDay(tanggal.day)

            tempKeluarga = [lastIdEmployee,dataKeluarga['form'].length + 1,nama,"other","Ayah",tglLahir
                            ,tempat,parseInt(kelamin),pendidikan.toUpperCase(),pekerjaan]

            dataKeluarga['form'].push(tempKeluarga)
        }

        if (req.body.keluarga.ibu.nama != "") {
            let tempKeluarga = []

            const nama = req.body.keluarga.ibu.nama
            const tempat = req.body.keluarga.ibu.tempatLahir

            //pada tanggal ada object {year, month, day}
            const tanggal = req.body.keluarga.ibu.tanggalLahir

            const kelamin = req.body.keluarga.ibu.kelamin
            const pendidikan = req.body.keluarga.ibu.pendidikan
            const pekerjaan = req.body.keluarga.ibu.pekerjaan

            const tglLahir = tanggal.year +'-'+ lib.dateMonth(tanggal.month) +'-'+ lib.dateDay(tanggal.day)

            tempKeluarga = [lastIdEmployee,dataKeluarga['form'].length + 1,nama,"other","Ibu",tglLahir
                            ,tempat,parseInt(kelamin),pendidikan.toUpperCase(),pekerjaan]

            dataKeluarga['form'].push(tempKeluarga)
        }

        if (req.body.keluarga.saudara.length > 0) {
            let tempKeluarga = []

            req.body.keluarga.saudara.forEach(async ele => {
                const nama = ele.nama
                const tempat = ele.tempatLahir

                //pada tanggal ada object {year, month, day}
                const tanggal = ele.tanggalLahir

                const kelamin = ele.kelamin
                const pendidikan = ele.pendidikan
                const pekerjaan = ele.pekerjaan

                const tglLahir = tanggal.year +'-'+ lib.dateMonth(tanggal.month) +'-'+ lib.dateDay(tanggal.day)

                tempKeluarga = [lastIdEmployee,dataKeluarga['form'].length + 1,nama,"other","Saudara",tglLahir
                            ,tempat,parseInt(kelamin),pendidikan.toUpperCase(),pekerjaan]

                    
                dataKeluarga['form'].push(tempKeluarga)
            });
        }

        if (req.body.keluarga.sumis.nama != "") {
            let tempKeluarga = []

            const nama = req.body.keluarga.sumis.nama
            const tempat = req.body.keluarga.sumis.tempatLahir

            //pada tanggal ada object {year, month, day}
            const tanggal = req.body.keluarga.sumis.tanggalLahir

            const kelamin = req.body.keluarga.sumis.kelamin
            const pendidikan = req.body.keluarga.sumis.pendidikan
            const pekerjaan = req.body.keluarga.sumis.pekerjaan

            let relation = "Istri"

            if (parseInt(kelamin) == 1) {
                relation = "Suami";
            }

            const tglLahir = tanggal.year +'-'+ lib.dateMonth(tanggal.month) +'-'+ lib.dateDay(tanggal.day)

            tempKeluarga = [lastIdEmployee,dataKeluarga['form'].length + 1,nama,"other",relation,tglLahir
                        ,tempat,parseInt(kelamin),pendidikan.toUpperCase(),pekerjaan]

                
            dataKeluarga['form'].push(tempKeluarga)
        }

        await employeeModel.insertDependents(dataKeluarga)

        if (req.body.organisasi.length > 0) {
            let tempOrganisasi = []

            let data = {}

            data['database'] = nameDatabase
            data['form'] = []

            req.body.organisasi.forEach(async ele => {
                const nama = ele.nama
                const jenis = ele.jenis

                // di dalam periode ada object { from: { year: '2021' }, to: { year: '2022' } }
                const periode = ele.periode
                
                const jabatan = ele.jabatan

                tempOrganisasi = [lastIdEmployee,nama,jenis,periode.from.year,periode.to.year,jabatan]

                data['form'].push(tempOrganisasi)
            });

            await employeeModel.insertOrganisasi(data)
        }

        //1 = Pasca Sarjana
        //2 = Sarjana
        //3 = Akademi
        //4 = SMA/K
        //5 = SMP
        //6 = SD

        if (req.body.pendidikan.akademi !== undefined) {
            const nama = req.body.pendidikan.akademi.nama

            // di dalam periode ada object { from: { year: '2021' }, to: { year: '2022' } }
            const periode = req.body.pendidikan.akademi.periode

            const jurusan = req.body.pendidikan.akademi.jurusan
            const keterangan = req.body.pendidikan.akademi.keterangan

            let data = {}

            data['database'] = nameDatabase;
            data['id_emp'] = lastIdEmployee
            data['id_edu'] = 3;
            data['name'] = nama;
            data['major'] = jurusan;
            data['year'] = periode.to.year;
            data['score'] = "0";
            data['period_from'] = periode.from.year +'-01-01';
            data['period_to'] = periode.to.year +'-01-01';
            data['keterangan'] = keterangan;

            await employeeModel.insertEducation(data)
        }

        if (req.body.pendidikan.pascaSarjana !== undefined) {
            const nama = req.body.pendidikan.pascaSarjana.nama

            // di dalam periode ada object { from: { year: '2021' }, to: { year: '2022' } }
            const periode = req.body.pendidikan.pascaSarjana.periode

            const jurusan = req.body.pendidikan.pascaSarjana.jurusan
            const keterangan = req.body.pendidikan.pascaSarjana.keterangan

            let data = {}

            data['database'] = nameDatabase;
            data['id_emp'] = lastIdEmployee
            data['id_edu'] = 1;
            data['name'] = nama;
            data['major'] = jurusan;
            data['year'] = periode.to.year;
            data['score'] = "0";
            data['period_from'] = periode.from.year +'-01-01';
            data['period_to'] = periode.to.year +'-01-01';
            data['keterangan'] = keterangan;

            await employeeModel.insertEducation(data)
        }

        if (req.body.pendidikan.sarjana !== undefined) {
            const nama = req.body.pendidikan.sarjana.nama

            // di dalam periode ada object { from: { year: '2021' }, to: { year: '2022' } }
            const periode = req.body.pendidikan.sarjana.periode

            const jurusan = req.body.pendidikan.sarjana.jurusan
            const keterangan = req.body.pendidikan.sarjana.keterangan

            let data = {}

            data['database'] = nameDatabase;
            data['id_emp'] = lastIdEmployee
            data['id_edu'] = 2;
            data['name'] = nama;
            data['major'] = jurusan;
            data['year'] = periode.to.year;
            data['score'] = "0";
            data['period_from'] = periode.from.year +'-01-01';
            data['period_to'] = periode.to.year +'-01-01';
            data['keterangan'] = keterangan;

            await employeeModel.insertEducation(data)
        }

        if (req.body.pendidikan.smak !== undefined) {
            const nama = req.body.pendidikan.smak.nama

            // di dalam periode ada object { from: { year: '2021' }, to: { year: '2022' } }
            const periode = req.body.pendidikan.smak.periode

            const jurusan = req.body.pendidikan.smak.jurusan
            const keterangan = req.body.pendidikan.smak.keterangan

            let data = {}

            data['database'] = nameDatabase;
            data['id_emp'] = lastIdEmployee
            data['id_edu'] = 4;
            data['name'] = nama;
            data['major'] = jurusan;
            data['year'] = periode.to.year;
            data['score'] = "0";
            data['period_from'] = periode.from.year +'-01-01';
            data['period_to'] = periode.to.year +'-01-01';
            data['keterangan'] = keterangan;

            await employeeModel.insertEducation(data)
        }

        if (req.body.pendidikan.smp !== undefined) {
            const nama = req.body.pendidikan.smp.nama

            // di dalam periode ada object { from: { year: '2021' }, to: { year: '2022' } }
            const periode = req.body.pendidikan.smp.periode

            const jurusan = req.body.pendidikan.smp.jurusan
            const keterangan = req.body.pendidikan.smp.keterangan

            let data = {}

            data['database'] = nameDatabase;
            data['id_emp'] = lastIdEmployee
            data['id_edu'] = 5;
            data['name'] = nama;
            data['major'] = jurusan;
            data['year'] = periode.to.year;
            data['score'] = "0";
            data['period_from'] = periode.from.year +'-01-01';
            data['period_to'] = periode.to.year +'-01-01';
            data['keterangan'] = keterangan;

            await employeeModel.insertEducation(data)
        }

        if (req.body.pendidikan.sd !== undefined) {
            const nama = req.body.pendidikan.sd.nama

            // di dalam periode ada object { from: { year: '2021' }, to: { year: '2022' } }
            const periode = req.body.pendidikan.sd.periode

            const jurusan = req.body.pendidikan.sd.jurusan
            const keterangan = req.body.pendidikan.sd.keterangan

            let data = {}

            data['database'] = nameDatabase;
            data['id_emp'] = lastIdEmployee
            data['id_edu'] = 6;
            data['name'] = nama;
            data['major'] = jurusan;
            data['year'] = periode.to.year;
            data['score'] = "0";
            data['period_from'] = periode.from.year +'-01-01';
            data['period_to'] = periode.to.year +'-01-01';
            data['keterangan'] = keterangan;

            await employeeModel.insertEducation(data)
        }

        if (req.body.nonFormal.length > 0) {
            let data = {}

            data['database'] = nameDatabase;
            data['form'] = []

            let tempNonFormal = []

            req.body.nonFormal.forEach(async ele => {
                const jenis = ele.jenis

                // di dalam periode ada object { from: { year: '2021' }, to: { year: '2022' } }
                const periode = ele.periode
                
                const penyelenggara = ele.penyelenggara
                const kota = ele.kota
                const sertifikat = ele.sertifikat

                tempNonFormal = [lastIdEmployee,jenis,periode.from.year,periode.to.year,penyelenggara,kota,sertifikat]

                data['form'].push(tempNonFormal)
            });

            await employeeModel.insertNonFormal(data)
        }

        if (req.body.prestasi.length > 0) {
            let data = {}

            data['database'] = nameDatabase;
            data['form'] = []

            let tempPrestasi = []
            req.body.prestasi.forEach(async ele => {
                const jenis = ele.jenis
                const jabatanText = ele.jabatan

                tempPrestasi = [lastIdEmployee,jenis,jabatanText]
                data['form'].push(tempPrestasi)
            });

            await employeeModel.insertPrestasi(data)
        }

        if (req.body.referensi.length > 0) {
            let tempReferensi = []

            let data = {}
            data['database'] = nameDatabase;
            data['form'] = []

            req.body.referensi.forEach(async ele => {
                const nama = ele.nama
                const hubungan = ele.hubungan
                const alamat = ele.alamat
                const noMobile = ele.telepon

                tempReferensi = [lastIdEmployee,data['form'].length + 1,nama,hubungan,alamat,noMobile]

                data['form'].push(tempReferensi)
            });

            await employeeModel.insertReferensi(data)
        }

        if (req.body.riwayat.length > 0) {
            let tempRiwayat = [];

            let data = {}

            data['database'] = nameDatabase;
            data['form'] = []

            req.body.riwayat.forEach(async ele => {
                const namaPerusahaan = ele.namaPerusahaan
                const jenis = ele.jenis
                const alamat = ele.alamat
                const telepon = ele.telepon
                const posisi = ele.posisi
                const gaji = ele.gaji
                const namaPimpinan = ele.namaPimpinan
                const namaAtasan = ele.namaAtasan

                //pada tanggal ada object year, month, day
                const tanggalMasuk = ele.tanggalMasuk
                const tanggalBerhenti = ele.tanggalBerhenti

                const tugas = ele.tugas
                const alasan = ele.alasan

                const startDate = tanggalMasuk.year +'-'+ lib.dateMonth(tanggalMasuk.month) +'-'+ lib.dateDay(tanggalMasuk.day)
                const endDate = tanggalBerhenti.year +'-'+ lib.dateMonth(tanggalBerhenti.month) +'-'+ lib.dateDay(tanggalBerhenti.day)
                
                tempRiwayat = [lastIdEmployee,data['form'].length + 1,namaPerusahaan,posisi,startDate,endDate,tugas,jenis,alamat
                                ,gaji,namaPimpinan,namaAtasan,telepon,alasan]

                data['form'].push(tempRiwayat)
            });

            await employeeModel.insertRiwayatPekerjaan(data)
        }

        console.log(lastIdEmployee)
        res.status(200).send({
            status:200,
            data:lastIdEmployee,
            message:"Selamat "+namaKaryawanForm+", Anda berhasil input data ke sistem. Terima kasih"
        })
    } catch(err) {
        console.log(err)
        res.status(500).send({
            status:500,
            data:{},
            message:"Error, Please check code or server"
        })
    }
}

karyawan.getAllKaryawan = async (req, res, next) => {
    let data = {}
    data['database'] = req.query.database
    
    const getData =  await employeeModel.getAllEmployee(data)
    
    res.status(200).send(getData)
}

karyawan.addPemotongan = async (req, res, next) => {
    try {
        const getTglMulai = req.body.tanggalMulai
        const getTglAkhir = req.body.tanggalAkhir

        let tglMulai = "0000-00-00";
        let tglAkhir = "0000-00-00";
        
        if (getTglMulai.year !== undefined) {
            tglMulai = getTglMulai.year +'-'+ lib.dateMonth(getTglMulai.month) +'-'+ lib.dateDay(getTglMulai.day)
        }
        if (getTglAkhir.year !== undefined) {
            tglAkhir = getTglAkhir.year +'-'+ lib.dateMonth(getTglAkhir.month) +'-'+ lib.dateDay(getTglAkhir.day)
        }

        let insertUpdate;
 
        if (req.body.nama == 'all') {
            let data = {}
            data['database'] = req.body.database
            data['form'] = []
            
            const getAllEmp = await employeeModel.getAllEmployee(data)

            if (getAllEmp.status == 200) {
                await getAllEmp.data.forEach(ele => {
                    const tempData = [ele.emp_number,req.body.jenis,req.body.nilai,req.body.keterangan,tglMulai,tglAkhir]
                    data['form'].push(tempData)
                });

                insertUpdate = await employeeModel.insertAllPemotongan(data)
            }
        } else {
            let data = {}
            data['database'] = req.body.database
            data['nama'] = req.body.nama
            data['jenis'] = req.body.jenis
            data['nilai'] = req.body.nilai
            data['keterangan'] = req.body.keterangan
            data['tglMulai'] = tglMulai
            data['tglAkhir'] = tglAkhir

            const cekData = await employeeModel.cekDataPemotongan(data)

            if (cekData.data.length == 0) {
                insertUpdate = await employeeModel.insertPemotongan(data)
            } else {
                data['id'] = cekData.data[0].emp_potongan_id
                insertUpdate = await employeeModel.updatePemotongan(data)
            }
        }

        if (insertUpdate.status == 200) {
            res.status(200).send(insertUpdate)
        } else {
            res.status(400).send(insertUpdate)
        }
    } catch(e) {
        res.status(500).send(e)
    }
}

karyawan.getAllPemotongan =  async (req, res, next) => {
    const db = req.query.database

    const getData = await employeeModel.getAllPemotongan(db)
    if (getData.status == 200 && getData.data.length > 0) {
        res.status(200).send(getData)
    } else {
        res.status(400).send(getData)
    }
}

karyawan.deletePemotongan =  async (req, res, next) => {
    let data = {} 
    data['database'] = req.body.database
    data['id'] = req.body.id

    const getData = await employeeModel.deletePemotongan(data)
    if (getData.status == 200) {
        res.status(200).send(getData)
    } else {
        res.status(400).send(getData)
    }
}

karyawan.deleteAllPemotonganByType =  async (req, res, next) => {
    let data = {} 
    data['database'] = req.body.database
    data['type'] = req.body.jenis

    const getData = await employeeModel.deleteAllPemotonganByType(data)
    if (getData.status == 200) {
        res.status(200).send(getData)
    } else {
        res.status(400).send(getData)
    }
}

karyawan.importAllEmp = async (req, res, next) => {
    try {
        const getData = req.body.data

        let data = {}
        data['database'] = req.body.database
        data['form'] = []

        let objTempJob = []
        
        let dataJob = {}
        dataJob['form'] = []
        dataJob['database'] = req.body.database

        await getData.forEach(async ele => {
            const namaJob = ele['Job Title']

            let objJob = {}
            objJob['database'] = req.body.database
            objJob['nama'] = namaJob

            let check = objTempJob.find(x => x.nama === namaJob);

            if (check == undefined) {
                objTempJob.push({nama:namaJob}) 

                if (namaJob != " ") {
                    const tempJob = [namaJob]
                    dataJob['form'].push(tempJob)
                }
            }
        })

        await jobModel.insertJob(dataJob)

        setTimeout(async () => {
            await getData.forEach(async ele => {
                let dataObj = {}
    
                dataObj['emp_id'] = ele['ID ']
                dataObj['npwp'] = ele['NPWP']
    
                const getFullName = ele['Full Name'];
                const splitFullName = getFullName.split(" ");
                if (splitFullName.length == 1) {
                    dataObj['namaAkhir'] = ""
                    dataObj['namaDepan'] = splitFullName[0]
                    dataObj['namaTengah'] = ""
                } else if (splitFullName.length == 2) {
                    dataObj['namaAkhir'] = splitFullName[1]
                    dataObj['namaDepan'] = splitFullName[0]
                    dataObj['namaTengah'] = ""
                } else if (splitFullName.length > 2) {
                    dataObj['namaAkhir'] = splitFullName[2]
                    dataObj['namaDepan'] = splitFullName[0]
                    dataObj['namaTengah'] = splitFullName[1]
                } else {
                    dataObj['namaAkhir'] = ""
                    dataObj['namaDepan'] = ""
                    dataObj['namaTengah'] = ""
                }
    
                const getTanggalLahir = ele['Date of Birth'];
    
                if (typeof getTanggalLahir == "object") {
                    dataObj['tempatLahir'] = ""
                    dataObj['tanggalLahir'] = getTanggalLahir.date
                } else {
                    const splitGetTanggalLahir = getTanggalLahir.split(",")              
                    const tempatLahir = splitGetTanggalLahir[0]
                    
                    dataObj['tempatLahir'] = tempatLahir
    
                    if (splitGetTanggalLahir[1] == undefined) {
                        dataObj['tanggalLahir'] = "0000-00-00" ;
                    } else {
                        const tglLahir = splitGetTanggalLahir[1].split("-")
                        if (tglLahir[1] !== undefined) {
                            dataObj['tanggalLahir'] = tglLahir[2]+"-"+tglLahir[1]+"-"+tglLahir[0].replace(/ /g,"") ;
                        } else {
                            dataObj['tanggalLahir'] = "0000-00-00" ;
                        }
                    }
                    
                }
                
                dataObj['join'] = ele['Join Date'].date;
                dataObj['alamat'] = ele['Address'];
                dataObj['division'] = ele['Division'];
                dataObj['phone'] = ele['Phone'];
                dataObj['ktp'] = ele['ID Number'];
                dataObj['kartu_keluarga'] = ele['Family Number'];
                dataObj['negara'] = 83;
                dataObj['email'] = ele['Email'];
                
                if (ele['Employee Status'] == "Permanent") {
                    dataObj['status_emp'] = 1;
                } else {
                    dataObj['status_emp'] = 2;
                }

                let jobData = {}
                jobData['database'] = req.body.database
                jobData['nama'] = ele['Job Title']

                await jobModel.getIdName(jobData).then(async (idJob) => {
                    if (idJob.data !== 0) {
                        dataObj['job'] = idJob.data
                    }
                })
        
                dataObj['agama'] = ele['Religion'];
                dataObj['status_nikah'] = ele['Marital Status'];
    
                if (ele['Gender'] == "Male") {
                    dataObj['kelamin'] = 1;
                } else {
                    dataObj['kelamin'] = 2;
                }
    
                switch (ele['Tax Status']) {
                    case "TK":
                        dataObj['ptkp'] = 1;
                        break;
                    case "K/0":
                        dataObj['ptkp'] = 2;
                        break;
                    case "K/1":
                        dataObj['ptkp'] = 3;
                        break;
                    case "K/2":
                        dataObj['ptkp'] = 4;
                        break;
                    case "K/3":
                        dataObj['ptkp'] = 5;
                        break;
                    default:
                        dataObj['ptkp'] = 1;
                        break;
                }
    
                //Set Job
    
                dataObj['salary'] = ele['Basic Salary']
    
                switch (ele['Keterangan']) {
                    case "Active":
                        dataObj['keterangan'] = 1
                        break;
                    case "New Hire":
                        dataObj['keterangan'] = 3
                        break;
                    case "Resign":
                        dataObj['keterangan'] = 2
                        break;
                
                    default:
                        dataObj['keterangan'] = 1
                        break;
                }
    
                const tempData = [dataObj.emp_id,dataObj.npwp,dataObj.namaDepan,dataObj.namaTengah,dataObj.namaAkhir,dataObj.tempatLahir,dataObj.tanggalLahir
                    ,dataObj.join,dataObj.alamat,dataObj.phone,dataObj.ktp,dataObj.kartu_keluarga,dataObj.negara,dataObj.status_emp,dataObj.agama
                    ,dataObj.status_nikah,dataObj.kelamin,dataObj.ptkp,dataObj.keterangan,dataObj.job]
    
                data['form'].push(tempData)
            });

            setTimeout(() => {
                const insertUpdate = employeeModel.importAllEmp(data)
                res.status(200).send(insertUpdate)
            }, 1000);
        }, 1000);
        
    } catch(e) {
        res.status(500).send(e)
    }
}

karyawan.absenFinger = async (req, res, next) => {
    try {
        let tempArr = {}
        tempArr['database'] = req.body.database
        tempArr['form'] = []

        const getData = req.body.data

        const getDataEmp = await employeeModel.getAllEmployeeNumber(tempArr)
        
        await getData.forEach(async ele => {
            let data = {}
            data['database'] = req.body.database
            data['offset'] = String(-(new Date().getTimezoneOffset() / 60))
            data['id'] = ele.id
            data['datetime'] = ele.datetime
            data['date'] = ele.date
            data['dateUtc'] = lib.convertUtc0(ele.datetime)

            const getIdEmp = getDataEmp.data.find(x => x.employee_id === ele.id);

            if (getIdEmp === undefined) {
                data['idEmp'] = 0
            } else {
                data['idEmp'] = getIdEmp.emp_number
            }
            
            const statusAbsen = ele.status

            if (data['idEmp'] !== 0) {
                if (statusAbsen == '0') {
                    data['status'] = "PUNCHED IN"                
                } else {
                    data['status'] = "PUNCHED OUT"
                }

                const arr = [data.idEmp, data.date, data.dateUtc, data.offset, data.datetime,data.status]

                tempArr['form'].push(arr)
            }
        });
        
        setTimeout(async () => {
            if (tempArr['form'].length > 0) {
                await absensiModel.insertUpdate(tempArr)
                res.status(200).send(lib.responseSuccess({}, "Berhasil insert Absensi"))
            } else {
                res.status(200).send(lib.responseSuccess({}, "Tidak ada data yang di insert"))
            }
        }, 500);
    } catch (Err) {
        console.log(Err)
        res.status(500).send(Err)
    }
}

karyawan.getKasbonEmp = async (req, res, next) => {
    let data = {}
    data['database'] = req.query.database
    data['month'] = null
    
    if (req.query.date !== undefined) {
        const dateKasbon = req.query.date
        const splitDate = dateKasbon.split("-")

        data['month'] = splitDate[1]
        data['year'] = splitDate[0]
    }

    const getData = await kasbonModel.getAllEmp(data)
    if (getData.status == 200) {
        res.status(200).send(getData)
    } else {
        res.status(400).send(getData)
    }
}

karyawan.addKasbon = async (req, res, next) => {
    try {
        const getTglKasbon = req.body.tglKasbon

        let tglKasbon = "0000-00-00";
        
        if (getTglKasbon.year !== undefined) {
            tglKasbon = getTglKasbon.year +'-'+ lib.dateMonth(getTglKasbon.month) +'-'+ lib.dateDay(getTglKasbon.day)
        }
 
        let data = {}
        data['database'] = req.body.database
        data['emp'] = req.body.emp
        data['date'] = tglKasbon
        data['nilai'] = req.body.nilai
        data['sisa'] = req.body.sisa
        data['status'] = req.body.status

        const insert = await kasbonModel.insert(data)
        
        if (insert.status == 200) {
            res.status(200).send(insert)
        } else {
            res.status(400).send(insert)
        }
    } catch(e) {
        res.status(500).send(e)
    }
}

karyawan.delKasbonEmp =  async (req, res, next) => {
    let data = {} 
    data['database'] = req.body.database
    data['id'] = req.body.idKasbon

    const getData = await kasbonModel.delete(data)

    if (getData.status == 200) {
        res.status(200).send(getData)
    } else {
        res.status(400).send(getData)
    }
}

karyawan.addCicilanKasbon = async (req, res, next) => {
    try {
        const getTglCicilan = req.body.tglCicilan

        let tglCicilan = "0000-00-00";
        
        if (getTglCicilan.year !== undefined) {
            tglCicilan = getTglCicilan.year +'-'+ lib.dateMonth(getTglCicilan.month) +'-'+ lib.dateDay(getTglCicilan.day)
        }
 
        let data = {}
        data['database'] = req.body.database
        data['id'] = req.body.id
        data['date'] = tglCicilan
        data['nilai'] = req.body.nilai
        
        const getSisaKasbon = await kasbonModel.getSisaKasbon(data)
        
        if (getSisaKasbon.status === 200) { 
            data['status'] = 0
            const sisaKasbon = parseInt(getSisaKasbon.data) - parseInt(req.body.nilai)

            data['sisaKasbon'] = sisaKasbon

            if (sisaKasbon === 0) {
                data['status'] = 1
            }

            const insert = await kasbonModel.insertCicilan(data)
        
            if (insert.status == 200) {
                await kasbonModel.updateSisaKasbon(data)
                res.status(200).send(insert)
            } else {
                res.status(400).send(insert)
            }
        } else {
            res.status(400).send(getSisaKasbon)
        }
    } catch(e) {
        res.status(500).send(e)
    }
}

karyawan.getCicilanKasbonById = async (req, res, next) => {
    let data = {}
    data['database'] = req.query.database
    data['id'] = req.query.id

    const getData = await kasbonModel.getCicilanById(data)
    if (getData.status == 200) {
        res.status(200).send(getData)
    } else {
        res.status(400).send(getData)
    }
}

module.exports = karyawan;