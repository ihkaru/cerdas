# 📝 Dokumen Spesifikasi Pengesahan & Optimalisasi Kuesioner Aplikasi Cerdas

**Lokasi Kegiatan:** Desa Sambora Mempawah
**Target Enumerator:** 18 Murid SMK Taruna Muhammadiyah

Dokumen ini berfungsi sebagai panduan final bagi pengembang aplikasi untuk mengunci konfigurasi tipe data, rumus validasi, dan otomatisasi sistem agar formulir bebas dari kesalahan input (*human error*) di lapangan.

---

## 1. Konfigurasi Blok Pengesahan Petugas (Prioritas Tinggi)

Berdasarkan hasil evaluasi pada **Blok Kuesioner Pengesahan Petugas**, sistem input saat ini masih bersifat manual. Untuk menghindari kesalahan input tanggal dan nama, mohon diubah dengan ketentuan berikut:

* **Otomatisasi Tanggal Pendataan:** Kolom `Tanggal Pendataan*` harus di-bypass dari input kalender manual menjadi otomatis mengunci hari pengisian menggunakan rumus:
```excel
// Tempatkan pada Initial Value di AppSheet
TODAY()
```

* **Dropdown Nama Petugas:** Jika sistem belum menggunakan bypass akun (`ctx.user.name`), kolom `Petugas*` harus dikunci menggunakan tipe data **Enum** (bukan teks bebas) dan **Wajib Diisi (Required)** dengan daftar 18 nama petugas resmi berikut (pastikan fitur *Allow other values* **dimatikan**):
1. KAMAL NURTESAR
2. FEBRIANTO
3. RISKI NAUFAL SAPUTRO
4. FATHUR RIDHO
5. M. Risky Ardiansyah
6. M. Nanda Nur Fajri
7. Cika Kirana
8. Abid Taufiqurahman
9. Agus Setiawan
10. M. Nazhif Fikri
11. Juan Tirta Raya
12. Revan
13. Jaka
14. Laras
15. Royan
16. Lalungguh
17. Fahrul
18. Catur Setiowati

---

## 2. Rumus Validasi Konsistensi Data (Valid_If Expression)

Sistem harus menolak atau memblokir proses penyimpanan data (tombol *Save*) jika kalkulasi matematika pada Blok 1 (Kependudukan) dan Blok 2 tidak sinkron. Mohon terapkan rumus pembatas (*constraint*) berikut pada bagian `Valid_If` di AppSheet:

* **Validasi Jenis Kelamin:**
`[Jumlah Anggota Keluarga di Rumah] = [Jumlah Anggota Keluarga Laki-laki] + [Jumlah Anggota Keluarga Perempuan]`

* **Validasi Komposisi Usia:**
`[Jumlah Anggota Keluarga di Rumah] = [Jumlah Usia 0 - 4 Tahun (Balita)] + [Jumlah Penduduk Berusia 5-9] + [Jumlah Penduduk Berusia 10-14] + [Jumlah Penduduk Berusia 15-19] + [Jumlah Penduduk Berusia 20-24] + [Jumlah Penduduk Berusia 25-29] + [Jumlah Penduduk Berusia 30-34] + ... (dan seterusnya sampai kelompok usia tertua)`

* **Validasi Tingkat Pendidikan:**
`[Jumlah Anggota Keluarga di Rumah] = [Jumlah Belum Sekolah] + [Jumlah Sedang TK] + [Jumlah Sedang SD] + [Jumlah Sedang SMP] + [Jumlah Sedang SMA] + [Jumlah Sedang D1-S1] + [Jumlah Sedang S2] + [Jumlah Tidak Pernah Sekolah]`

* **Validasi Angka Pekerjaan:**
`[Jumlah Anggota Keluarga di Rumah] = [Jumlah Petani] + [Jumlah PNS] + [Jumlah TNI] + [Jumlah Polri] + [Jumlah Pensiunan PNS/TNI/Polri] + [Jumlah Wiraswasta] + [Jumlah Mengurus Rumah Tangga] + [Jumlah Pelajar] + [Jumlah Belum Bekerja] + [Jumlah Lainnya]`

> ⚠️ **Catatan Khusus untuk Agama & Suku:** Karena kolom angka jumlah muncul secara dinamis berdasarkan tombol pilihan (*chips*) yang ditekan, pastikan total penjumlahan dari angka-angka agama/suku yang diinput tersebut juga wajib **sama dengan** total `Jumlah Anggota Keluarga di Rumah`.

---

## 3. Optimasi Logika Bersyarat (Skip Logic / Show_If)

Untuk memangkas panjang formulir agar enumerator tidak lelah melihat kolom yang tidak relevan di layar HP, mohon terapkan formula `Show_If` berikut:

* **Blok 3 (Bantuan Sosial):** Tambahkan satu pertanyaan penyaring (*filter*) di awal Blok 3:
`"Apakah keluarga ini menerima Bantuan Sosial (Bansos)?"` (Tipe: Yes/No).
* Jika dijawab **No**, maka kolom `Jml_Penerima_Terdaftar_PKH`, `Jml_Penerima_Terdaftar_BLT`, dan `Jml_Penerima_Terdaftar_BPNT` otomatis disembunyikan secara menyeluruh.

* **Logika Detail Nama Penerima Manfaat:**
* Kolom input teks nama (contoh: `Nama Penerima Manfaat BPNT`) hanya boleh muncul (*Show_If*) jika kolom jumlah terkait (`Jml_Penerima_Terdaftar_BPNT`) diisi angka **lebih besar dari 0**.

* **Blok Anak Putus Sekolah & UMKM:**
* Kolom nama anak putus sekolah hanya muncul jika `Jumlah Anggota Keluarga Putus Sekolah` > 0.
* Kolom rincian jenis/kegiatan UMKM hanya muncul jika `Jumlah UMKM dalam Keluarga` > 0.

---

## 4. Standarisasi Tipe Data Enum (Dropdown) & Kebersihan Data

Berdasarkan pengecekan struktur tabel pada backend AppSheet, aturan nilai pilihan harus dikunci dengan ketentuan sebagai berikut:

### A. Nonaktifkan Fitur Teks Bebas (`Allow other values` di-UNCHECK)

Untuk kolom-kolom fisik struktur rumah di **Blok Kuesioner 4**, pastikan fitur `Allow other values` **dimatikan**. Pengisian harus mutlak memilih opsi di bawah ini guna menghindari data kotor akibat *typo* ketikan siswa:

* **`Kepemilikan_Rumah`** -> Pilihan tetap: *Milik Sendiri, Milik Keluarga/Warisan, Kontrak, Sewa, Rumah Dinas, Menumpang, Rumah Adat/Komunal, Lainnya*.
* **`Jenis Dinding Rumah`** -> Pilihan tetap: *Tembok Permanen, Tembok dan Kayu, Kayu, Lainnya*.
* **`Jenis Lantai Rumah`** -> Pilihan tetap: *Keramik, Semen, Kayu, Tanah, Lainnya*.
* **`Jenis Atap Rumah`** -> Pilihan tetap: *Genteng, Seng, Sirap Kayu, Daun/Rumbia/Nipah*. *(Catatan: Pilihan Sirap Kayu dan Tembok-Kayu sudah sangat sesuai dengan kearifan lokal Kalimantan Barat).*

### B. Aktifkan Fitur Pendukung (`Auto-complete other values` di-CHECK)

Untuk kolom sanitasi dan lingkungan di **Blok Kuesioner 6 & 7**, fitur *Auto-complete* boleh tetap diaktifkan untuk menangkap variasi lapangan yang dinamis:

* **`sumber air minum`** & **`sumber air bersih`** -> Opsi: *Air Ledeng/PDAM, Sumur Bor/Pompa, Sumur Gali, Mata Air, Air Hujan, Air isi Ulang (depot), Air kemasan bermerek*.
* **`Cara membuang sampah`** -> Opsi: *Dibakar, Diangkut Petugas, Dikelola sendiri (kompos), Dikelola sendiri (pakan ternak/maggot), Dibuang ke sungai/saluran drainase/parit, Dibuang ke lahan kosong, Ditimbun di pekarangan, Dibuang sembarangan, Disetor ke bank sampah, Lainnya*.

---

## 5. Perbaikan Input Manual Teks Menjadi Form Dinamis

* **Kolom Nama Kepala Keluarga (Blok 1):** Teks instruksi *"Jika ada dua kepala ruta atau lebih, pisahkan namanya dengan tanda slash (/)"* harus **dihapus**.
* **Solusi Teknis:** Ubah kolom input teks tunggal ini menjadi **Form Dinamis** (bisa menggunakan fitur *IsPartOf* pada tabel anak/child table di AppSheet). Sistem harus menyediakan satu kolom input nama biasa, yang disertai tombol **`[+ Tambah Kepala Keluarga]`** jika dalam satu rumah tangga terdapat lebih dari satu KK. Hal ini untuk mencegah kegagalan proses pembacaan data (*parsing error*) di database backend (Go/Rust).

---

## III. Aturan Validasi Mutlak Matematika (Valid_If Backend)

Aplikasi harus menolak instruksi simpan data jika total penjumlahan kelompok variabel di bawah ini **tidak sama dengan** nilai pada kolom `Jumlah_Anggota_Keluarga_di_Rumah` ($TotalART$):

$$\text{Validasi Jenis Kelamin} \rightarrow TotalART = Laki\text{-}laki + Perempuan$$
$$\text{Validasi Usia} \rightarrow TotalART = \sum(\text{Seluruh Kolom Kelompok Usia})$$
$$\text{Validasi Pendidikan} \rightarrow TotalART = \sum(\text{Seluruh Kolom Jenjang Pendidikan})$$
$$\text{Validasi Pekerjaan} \rightarrow TotalART = \sum(\text{Seluruh Kolom Kategori Pekerjaan})$$
$$\text{Validasi Agama \& Suku} \rightarrow TotalART = \sum(\text{Angka Agama yang diinput}) = \sum(\text{Angka Suku yang diinput})$$
