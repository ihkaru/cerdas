# Framework7 Vue Theming & Layout Best Practices

Dokumen ini berisi panduan, aturan, dan praktik terbaik (*best practices*) dalam melakukan kustomisasi tema (*theming*), warna, dan penyesuaian tata letak (*layout*) pada aplikasi Cerdas yang menggunakan **Framework7 v9 + Vue 3**.

---

## 1. Kustomisasi Tema Global (CSS Variables)

Metode utama dan paling disarankan untuk mengubah tampilan visual Framework7 adalah dengan menimpa (*override*) variabel CSS di bawah selektor `:root` atau `.theme-dark` di berkas CSS global (`src/style.css`).

### Aturan Utama:
* **Hindari mengubah CSS internal F7 langsung**: Timpa CSS variabelnya saja agar pustaka library tetap bersih dan mudah diperbarui.
* **Variabel CSS Utama**:
  ```css
  :root {
    --f7-theme-color: #2196f3;       /* Warna primer aplikasi */
    --f7-theme-color-rgb: 33, 150, 243;
    
    /* Navbar & Toolbar */
    --f7-navbar-height: 44px;        /* iOS: 44px, MD: 56px */
    --f7-navbar-bg-color: #ffffff;
    --f7-navbar-shadow-image: none;
    
    /* Page Content */
    --f7-page-bg-color: #f3f4f6;     /* Background abu-abu premium */
  }
  ```

---

## 2. Manajemen Warna Dinamis & Mode Gelap

Untuk elemen tunggal atau kondisi runtime, gunakan fitur bawaan Framework7 daripada menulis kelas CSS kustom dari awal.

### Best Practices:
1. **Gunakan Prop `color` Bawaan Komponen**:
   Hampir semua komponen F7 menerima prop `color`. Selalu prioritaskan prop ini:
   ```html
   <f7-button color="red">Hapus</f7-button>
   ```
2. **Helper Classes**:
   Gunakan kelas utilitas warna bawaan F7 untuk teks dan latar belakang:
   - `text-color-[color]` (contoh: `text-color-gray`, `text-color-red`)
   - `bg-color-[color]` (contoh: `bg-color-blue`)
3. **Mode Gelap (Dark Mode)**:
   Cukup aktifkan kelas `.theme-dark` pada elemen root (biasanya tag `<div id="app">` atau `<html>`). Seluruh komponen F7 akan otomatis beralih menggunakan palet warna gelap bawaan.

---

## 3. Adaptasi Lintas Platform (iOS vs MD/Android)

Framework7 mendeteksi platform secara otomatis saat aplikasi dimuat. Gunakan penanda kelas bawaan untuk mengatur style atau tata letak spesifik platform.

### Helper Classes Platform:
* `if-ios` / `if-not-ios`: Elemen hanya muncul atau aktif di perangkat iOS.
* `if-md` / `if-not-md`: Elemen hanya muncul atau aktif di perangkat Android/Desktop (Material Design).

### Contoh Penggunaan CSS Lintas Platform:
```css
/* Padding khusus ketika berjalan di Android/MD */
.if-md .custom-card {
  margin-top: 16px;
}
```

---

## 4. Penanganan Spasing & Glitch Layout Navbar (Critical Fixes)

Ketika halaman menggunakan `:page-content="false"` pada `<f7-page>` untuk merancang tata letak dinamis/kustom:

1. **Gunakan `<f7-page-content>`**:
   Selalu gunakan komponen Vue `<f7-page-content>` alih-alih `div` HTML mentah dengan kelas `page-content`. Ini memastikan perhitungan offset navbar berjalan secara otomatis.
2. **Pangkas Jarak Berlebih dengan Inline Style + `!important`**:
   Jika Framework7 mengalami konflik rendering (misal karena kompilasi asinkron atau letak elemen di dalam `<template v-if>`), paksakan tinggi padding atas (*padding-top*) kontainer agar bernilai tepat menggunakan kalkulasi tinggi navbar bawaan:
   ```html
   <f7-page-content style="padding-top: calc(var(--f7-navbar-height) + var(--f7-safe-area-top, 0px)) !important;">
     ...
   </f7-page-content>
   ```
   *Catatan: Metode inline style ini kebal terhadap isu caching berkas CSS eksternal.*
