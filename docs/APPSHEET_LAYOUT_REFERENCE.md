# AppSheet Feature Reference: Grouped Deck View

Dokumen ini adalah referensi untuk mengimplementasikan fitur "Grouped Layout" ala AppSheet ke dalam aplikasi Cerdas. Fitur ini memungkinkan navigasi data dalam jumlah besar dengan memecahnya menjadi struktur folder hierarkis.

## 1. Konsep & Behavior

### Grouping (Drill-down Navigation)
Alih-alih menampilkan flat list dari semua record, AppSheet menggunakan konfigurasi `Group By` untuk membuat navigasi bertingkat.

**Alur UI:**
1.  **Level 1 (Group List):** Menampilkan daftar unik dari *Kolom Group 1* (Contoh: List Kecamatan).
    *   *User Action:* Klik "Anjongan".
    *   *System Action:* Filter data `WHERE kecamatan = 'Anjongan'`, lalu tampilkan Level 2.
2.  **Level 2 (Group List):** Menampilkan daftar unik dari *Kolom Group 2* (Contoh: List Desa) berdasarkan filter Level 1.
    *   *User Action:* Klik "Anjungan Dalam".
    *   *System Action:* Filter data `WHERE kecamatan = 'Anjongan' AND desa = 'Anjungan Dalam'`, lalu tampilkan Data View.
3.  **Level Akhir (Data/Deck View):** Menampilkan record aktual dalam format kartu.

### Deck View Layout
Tampilan list item bergaya kartu (Deck) yang padat informasi.

**Komponen Kartu:**
*   **Thumbnail:** Gambar persegi di sebelah kiri.
*   **Primary Header:** Teks utama (Tebal).
*   **Secondary Header:** Teks penjelas (Abu-abu/Kecil).
*   **Inline Actions:** Tombol aksi (Edit/Delete) yang langsung bisa diakses di list, biasanya di sebelah kanan.

---

## 2. Mapping Konfigurasi

Berikut adalah usulan struktur JSON Schema untuk mereplikasi konfigurasi AppSheet ini di Cerdas.

### AppSheet Config (Dari Gambar)
*   **View Type:** Deck
*   **Group By:** Kecamatan, Desa/Kelurahan, Nama*
*   **Main Image:** Auto assign (Gambar Rumah)
*   **Primary Header:** Nama*
*   **Secondary Header:** Desa/Kelurahan
*   **Actions:** Auto (Delete, Edit, View Map)

### Cerdas JSON Schema Proposal
Dalam properti `layout` di table `app_schemas`:

```json
{
  "views": {
    "rumah_list": {
      "type": "deck", // deck | table | gallery | map
      "title": "Rumah",
      
      // Configuration for Drill-down
      "groupBy": ["kecamatan", "desa_kelurahan"], 
      
      // Configuration for the Card UI
      "deck": {
        "imageField": "foto_rumah_base64", // Field untuk thumbnail
        "imageShape": "square",            // square | circle | full
        "primaryHeaderField": "nama_kepala_keluarga",
        "secondaryHeaderField": "status_verifikasi",
        "showActions": true 
      },

      // Actions allowed in this view
      "actions": ["edit", "delete", "view_map"]
    }
  }
}
```

---

## 3. Implementasi Teknis (Roadmap)

### Backend / Schema
1.  Update schema renderer untuk membaca properti `groupBy`.

### Frontend (Vue/F7)
1.  **Smart ListView Component:**
    *   Komponen list harus mampu mendeteksi apakah sedang dalam mode "Grouping" atau "Data Display".
    *   Memerlukan state `currentGroupLevel` (index dari array `groupBy`) dan `currentFilters` (objek filter akumulatif).
### SQL Query Builder (JSON Aware)
Mengingat data atribut (seperti Kecamatan, Desa) tersimpan dalam kolom JSON `prelist_data`, query grouping harus mengekstrak nilai dari JSON.

*   **Query untuk Grouping (Level 1/2):**
    Menggunakan `json_extract` (SQLite) untuk mengambil unique value dari atribut JSON.
    ```sql
    -- Contoh Group by 'kecamatan'
    SELECT DISTINCT json_extract(prelist_data, '$.kecamatan') as group_key, COUNT(*) 
    FROM assignments 
    WHERE app_schema_id = ? 
    GROUP BY json_extract(prelist_data, '$.kecamatan')
    ```

*   **Query untuk Data (Level Akhir):**
    ```sql
    SELECT * FROM assignments 
    WHERE app_schema_id = ? 
      AND json_extract(prelist_data, '$.kecamatan') = 'SelectedKecamatan'
      AND json_extract(prelist_data, '$.desa') = 'SelectedDesa'
    LIMIT x OFFSET y
    ```

*   **Optimasi:** Untuk performa pada dataset 10k+, disarankan membuat **Virtual Generated Columns** atau **Index** pada field yang sering dijadikan Grouping Key di SQLite agar tidak perlu parsing JSON berulang kali saat query.

## 4. Visual Reference
(Disimpan dari screenshot user)

*   **Group View:** Simple List dengan chevron (`>`) di kanan.
*   **Deck View:** Card List dengan Thumbnail.

---
**Catatan:** Fitur ini sangat krusial untuk performa Offline-First dengan dataset besar (10k+ rows) karena mencegah rendering list yang terlalu panjang sekaligus memudahkan user mencari data spesifik.
