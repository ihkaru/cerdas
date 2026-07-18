# Example App: Kuesioner Sambora Mempawah

File `schema.json` di dalam folder ini adalah contoh skema aplikasi Cerdas (*AppSheet clone*) yang dikembangkan untuk pendataan lapangan Desa Sambora, Mempawah oleh SMK Taruna Muhammadiyah.

## 📋 Cara Menggunakan

1. Buka **Cerdas Editor App** (`http://localhost:9982` atau domain production Anda).
2. Pilih **Buat Aplikasi Baru** > **Import dari JSON / Code Editor**.
3. Salin seluruh isi dari file [`schema.json`](file:///c:/projects/cerdas/examples/kuesioner-sambora/schema.json) dan paste ke tab **Code Editor**.
4. Klik **Save / Apply Schema**.

## 💡 Fitur Kuesioner Ini:
- **Offline-First & Auto-Scrubbing**: Data tersembunyi (`show_if=false`) otomatis dibersihkan saat disimpan.
- **Validasi Kondisional (`required_if_fn`)**: Mengunci kolom jumlah jika pilihan suku/agama dicentang.
- **Multi-Select Checkbox**: Pengolahan sampah mendukung lebih dari satu pilihan.
- **UX Hint Text**: Petunjuk kontekstual di bawah setiap kolom penting sesuai standar KoBoToolbox / ODK.
