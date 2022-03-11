const express = require('express');
const router = express.Router();
const path = require('path');
const appDir = path.dirname(require.main.filename);
const token = require(appDir+'/controller/token')
const lib = require(appDir+'/controller/lib')
const mysqlConf = require(appDir+'/controller/mysqlConf')

router.post('/addKandidat', async function(req, res, next) {
    try {
        const conn = await mysqlConf.conn(req.body.database);
        console.log(req.body)

        if (req.body.biodata.nama == "") {
            res.status(400).send({
                status:400,
                data:{},
                message:"Form Nama karyawan belum terisi"
            })
        } else {
            const nama = req.body.biodata.nama
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
            const namaBank = req.body.biodata.namaBank
            const namaRekening = req.body.biodata.namaRekening
            const noRekening = req.body.biodata.noRekening
            const noHp = req.body.biodata.noHp
            const sim = req.body.biodata.sim
            const jenisSim = req.body.biodata.jenisSim
            const kendaraan = req.body.biodata.kendaraan
            const jenisKendaraan = req.body.biodata.jenisKendaraan
        }

        if (req.body.bahasa.length > 0) {
            req.body.bahasa.forEach(ele => {
                const namaBahasa = ele.nama
                const berBahasa = ele.berbicara
                const menuBahasa = ele.menulis
                const mendBahasa = ele.mendengarkan
            });
        }

        if (req.body.keahlian.length > 0) {
            req.body.keahlian.forEach(ele => {
                const keahlian = ele
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

        if (req.body.kerja !== undefined) {
            
            //pada tanggal masuk ada object {year, month, day}
            const tanggal = req.body.kerja.tanggalMasuk

            const posisi = req.body.kerja.posisiTerakhir
            const gajiTerakhir = req.body.kerja.gajiTerakhir
            const gajiDiharapkan = req.body.kerja.gajiDiharapkan
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

        conn.promise().execute("SELECT emp_lastname FROM hs_hr_employee")
            .then(([rows, fields]) => {

                res.status(200).send({
                    status:200,
                    data:rows,
                    message:"Success Get Table hs_hr_employee"
                })
            })
            .catch((err) => {
                console.log("Failed Execute Query "+String(err.sqlMessage))

                res.status(400).send({
                    status:400,
                    data:{},
                    message:String(err.sqlMessage)
                })
            })
            .finally(() => conn.end())
    } catch(err) {
        console.log(err)
        res.status(500).send({
            status:500,
            data:{},
            message:"Error, Please check code or server"
        })
    }
});

module.exports = router;