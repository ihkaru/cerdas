# Strategi 2-Way Data Binding: Google Sheet (2026 Edition)

Dokumen ini merinci rencana implementasi fitur sinkronisasi dua arah antara Backend Cerdas (Laravel) dan Google Sheets, berdasarkan strategi "Minimum Input User" dan "Cepat Jadi".

## 🎯 Filosofi & Pendekatan
**Tujuan**: Memberikan fitur sinkronisasi data yang reliable tanpa membebani user dengan setup Google Cloud Console yang rumit.

**Keputusan Arsitektur**:
- **Metode**: Google Drive API v3 `files.watch` (Metode Lama).
- **Alasan**: Setup lebih cepat, satu endpoint API, gratis, dan cukup reliable untuk skala SaaS kecil/menengah.
- **Menghindari**: Google Cloud Pub/Sub (terlalu kompleks setup-nya untuk user).

---

## 🔄 User Workflow
1. **Input Link**: User menyalin dan menempel (paste) Link Google Sheet ke dalam aplikasi Cerdas.
2. **Connect**: User menekan tombol "Connect".
3. **Auth**: Aplikasi meminta izin akses Google Drive/Sheets (OAuth) jika belum ada.
4. **Setup**: Backend memverifikasi akses ke sheet tersebut dan mendaftarkan `watch`.

---

## 🛠️ Detail Implementasi Teknis (Laravel)

### 1. Google Drive API Integration
Gunakan library client Google API untuk PHP. Fokus pada endpoint `files.watch`.

### 2. Expiration Management
Token `watch` Google Drive hanya berlaku selama **7 hari**. Kita perlu mekanisme renewal otomatis agar user tidak perlu re-connect setiap minggu.

**Database Schema (Contoh Konsep):**
Tabel `user_sheet_watches`:
- `id`
- `user_id`
- `sheet_file_id`
- `watch_resource_id`
- `expiration_timestamp` (datetime)
- `synced_form_id`

### 3. "Self-Healing" Scheduler
Wajib ada Laravel Scheduler yang berjalan harian (`daily()`) untuk memeriksa token yang akan kadaluarsa.

```php
// Logic: Cari token yang mau expired 2 hari lagi, lalu perpanjang.
// Dijadwalkan lari setiap hari.
$dyingTokens = UserSheetWatch::where('expiration_timestamp', '<', now()->addDays(2))->get();

foreach ($dyingTokens as $token) {
    try {
        $this->googleService->stopWatch($token->id); // Stop old watch if needed
        $newWatch = $this->googleService->startWatch($token->sheet_file_id);
        $token->update([
            'expiration_timestamp' => $newWatch->expiration,
            'watch_resource_id' => $newWatch->resourceId
        ]);
    } catch (\Exception $e) {
        // Log error, mungkin user revoke akses atau sheet dihapus
        Log::error("Failed to renew watch for sheet {$token->sheet_file_id}: " . $e->getMessage());
    }
}
```

### 4. Handling Webhooks
- Laravel menyediakan **satu endpoint API** yang bisa diakses publik (misal: `https://api.cerdas.com/webhooks/google-drive`).
- Google akan mengirimkan notifikasi ke endpoint ini saat ada perubahan di Sheet.
- **Logic Webhook**:
    1. Terima notifikasi.
    2. Identifikasi Sheet ID dan Resource ID dari header request.
    3. Cari `form_id` yang terhubung di database.
    4. Trigger Job Queue: `ProcessSheetSyncJob`.

### 5. `ProcessSheetSyncJob` (Queue)
- Fetch data terbaru dari Google Sheet.
- Bandingkan dengan data di database (berdasarkan ID atau Row Index).
- Lakukan Update/Insert/Delete di database Cerdas.
- **Penting**: Pastikan tidak terjadi *infinite loop* (Cerdas update Sheet -> Sheet trigger webhook -> Cerdas update database -> Cerdas update Sheet lagi). Gunakan flag atau checksum.

---

## 📝 Catatan Pengembangan
- **Library**: `google/apiclient` via Composer.
- **Domain Verification**: Domain webhook harus diverifikasi di Google Console projek milik Developer (bukan User).
- **Rate Limiting**: Perhatikan kuota API Google. Gunakan Job Queue untuk memproses sync agar tidak terkena timeout.
