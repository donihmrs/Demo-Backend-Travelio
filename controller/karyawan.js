const path = require('path');
const appDir = path.dirname(require.main.filename);
const token = require(appDir+'/controller/token')
const lib = require(appDir+'/controller/lib')

const employeeModel = require(appDir+'/model/employeeModel')
const bahasaModel = require(appDir+'/model/bahasaModel')
const skillModel = require(appDir+'/model/skillModel')

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
                data['nama'] = namaBahasa;
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
            req.body.keahlian.forEach(ele => {
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

        if (req.body.keluarga.anak.length > 0) {
            req.body.keluarga.anak.forEach(ele => {
                const nama = ele.nama
                const tempat = ele.tempatLahir

                //pada tanggal ada object {year, month, day}
                const tanggal = ele.tanggalLahir

                const kelamin = ele.kelamin
                const pendidikan = ele.pendidikan
                const pekerjaan = ele.pekerjaan
            });
        }

        if (req.body.keluarga.ayah.nama != "") {
            const nama = req.body.keluarga.ayah.nama
            const tempat = req.body.keluarga.ayah.tempatLahir

            //pada tanggal ada object {year, month, day}
            const tanggal = req.body.keluarga.ayah.tanggalLahir

            const kelamin = req.body.keluarga.ayah.kelamin
            const pendidikan = req.body.keluarga.ayah.pendidikan
            const pekerjaan = req.body.keluarga.ayah.pekerjaan
        }

        if (req.body.keluarga.ibu.nama != "") {
            const nama = req.body.keluarga.ibu.nama
            const tempat = req.body.keluarga.ibu.tempatLahir

            //pada tanggal ada object {year, month, day}
            const tanggal = req.body.keluarga.ibu.tanggalLahir

            const kelamin = req.body.keluarga.ibu.kelamin
            const pendidikan = req.body.keluarga.ibu.pendidikan
            const pekerjaan = req.body.keluarga.ibu.pekerjaan
        }

        if (req.body.keluarga.saudara.length > 0) {
            req.body.keluarga.saudara.forEach(ele => {
                const nama = ele.nama
                const tempat = ele.tempatLahir

                //pada tanggal ada object {year, month, day}
                const tanggal = ele.tanggalLahir

                const kelamin = ele.kelamin
                const pendidikan = ele.pendidikan
                const pekerjaan = ele.pekerjaan
            });
        }

        if (req.body.keluarga.sumis.nama != "") {
            const nama = req.body.keluarga.sumis.nama
            const tempat = req.body.keluarga.sumis.tempatLahir

            //pada tanggal ada object {year, month, day}
            const tanggal = req.body.keluarga.sumis.tanggalLahir

            const kelamin = req.body.keluarga.sumis.kelamin
            const pendidikan = req.body.keluarga.sumis.pendidikan
            const pekerjaan = req.body.keluarga.sumis.pekerjaan
        }

        if (req.body.organisasi.length > 0) {
            req.body.organisasi.forEach(ele => {
                const nama = ele.nama
                const jenis = ele.jenis

                // di dalam periode ada object { from: { year: '2021' }, to: { year: '2022' } }
                const periode = ele.periode
                
                const jabatan = ele.jabatan
            });
        }

        if (req.body.pendidikan.akademi !== undefined) {
            const nama = req.body.pendidikan.akademi.nama

            // di dalam periode ada object { from: { year: '2021' }, to: { year: '2022' } }
            const periode = req.body.pendidikan.akademi.periode

            const jurusan = req.body.pendidikan.akademi.jurusan
            const keterangan = req.body.pendidikan.akademi.keterangan
        }

        if (req.body.pendidikan.pascaSarjana !== undefined) {
            const nama = req.body.pendidikan.pascaSarjana.nama

            // di dalam periode ada object { from: { year: '2021' }, to: { year: '2022' } }
            const periode = req.body.pendidikan.pascaSarjana.periode

            const jurusan = req.body.pendidikan.pascaSarjana.jurusan
            const keterangan = req.body.pendidikan.pascaSarjana.keterangan
        }

        if (req.body.pendidikan.sarjana !== undefined) {
            const nama = req.body.pendidikan.sarjana.nama

            // di dalam periode ada object { from: { year: '2021' }, to: { year: '2022' } }
            const periode = req.body.pendidikan.sarjana.periode

            const jurusan = req.body.pendidikan.sarjana.jurusan
            const keterangan = req.body.pendidikan.sarjana.keterangan
        }

        if (req.body.pendidikan.smak !== undefined) {
            const nama = req.body.pendidikan.smak.nama

            // di dalam periode ada object { from: { year: '2021' }, to: { year: '2022' } }
            const periode = req.body.pendidikan.smak.periode

            const jurusan = req.body.pendidikan.smak.jurusan
            const keterangan = req.body.pendidikan.smak.keterangan
        }

        if (req.body.pendidikan.smp !== undefined) {
            const nama = req.body.pendidikan.smp.nama

            // di dalam periode ada object { from: { year: '2021' }, to: { year: '2022' } }
            const periode = req.body.pendidikan.smp.periode

            const jurusan = req.body.pendidikan.smp.jurusan
            const keterangan = req.body.pendidikan.smp.keterangan
        }

        if (req.body.pendidikan.sd !== undefined) {
            const nama = req.body.pendidikan.sd.nama

            // di dalam periode ada object { from: { year: '2021' }, to: { year: '2022' } }
            const periode = req.body.pendidikan.sd.periode

            const jurusan = req.body.pendidikan.sd.jurusan
            const keterangan = req.body.pendidikan.sd.keterangan
        }

        if (req.body.nonFormal.length > 0) {
            req.body.nonFormal.forEach(ele => {
                const jenis = ele.jenis

                // di dalam periode ada object { from: { year: '2021' }, to: { year: '2022' } }
                const periode = ele.periode
                
                const penyelenggara = ele.penyelenggara
                const kota = ele.kota
                const sertifikat = ele.sertifikat
            });
        }

        if (req.body.prestasi.length > 0) {
            req.body.prestasi.forEach(ele => {
                const jenis = ele.jenis
                const jabatanText = ele.jabatan
            });
        }

        if (req.body.referensi.length > 0) {
            req.body.referensi.forEach(ele => {
                const nama = ele.nama
                const hubungan = ele.hubungan
                const alamat = ele.alamat
                const telepon = ele.telepon
            });
        }

        if (req.body.riwayat.length > 0) {
            req.body.riwayat.forEach(ele => {
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
            });
        }

        // conn.promise().execute("SELECT emp_lastname FROM hs_hr_employee")
        //     .then(([rows, fields]) => {
        //         console.log(rows)
        //         res.status(200).send({
        //             status:200,
        //             data:rows,
        //             message:"Success Get Table hs_hr_employee"
        //         })
        //     })
        //     .catch((err) => {
        //         console.log("Failed Execute Query "+String(err.sqlMessage))

        //         res.status(400).send({
        //             status:400,
        //             data:{},
        //             message:String(err.sqlMessage)
        //         })
        //     })
        //     .finally(() => conn.end())

        console.log(lastIdEmployee)
        res.status(200).send({
            status:200,
            data:{},
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

module.exports = karyawan;