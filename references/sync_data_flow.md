# Cerdas Client Sync & Data Context Flow

```mermaid
graph TD
    subgraph "Server Side"
        ServerDB[(Server Database)]
        API_Assign[GET /assignments]
        API_Resp[GET /responses]
    end

    subgraph "Client Side (Local)"
        LocalDB[(SQLite Local DB)]
        
        subgraph "Sync Service"
            params[Sync Parameters]
            note_params["Context: form_id (App ID)<br/>Filter responses by app_schema_id=form_id"]
            
            Push[Push Pending Data]
            PullAssign["Pull Assignments<br/>(contains prelist_data)"]
            PullResp["Pull Responses<br/>(contains response_data)"]
        end

        subgraph "Data Loading Logic"
            UserAction((User Opens Form))
            Query[Query: Assignment + Response]
            Decision{Has Response?}
            
            LoadPrelist[Load Prelist Data Only]
            LoadResponse[Load Response Data]
            
            InitPrelist[Initialize Form Model<br/>from Prelist Data]
            InitMixed[Initialize Form Model<br/>Merge Prelist Response]
            
            FormUI[Form UI Render]
        end
    end

    %% Sync Flow
    ServerDB --> API_Assign
    ServerDB --> API_Resp
    
    params -.-> note_params
    note_params -.-> PullAssign
    note_params -.-> PullResp
    
    API_Assign --> PullAssign
    API_Resp --> PullResp
    
    Push --> ServerDB
    PullAssign --> LocalDB
    PullResp --> LocalDB

    %% Opening Flow
    UserAction --> Query
    LocalDB --> Query
    Query --> Decision
    
    %% Scenario 1: No Response (New Task)
    Decision -->|No Status: assigned| LoadPrelist
    LoadPrelist --> InitPrelist
    InitPrelist --> FormUI
    
    %% Scenario 2: Response Exists (Draft or Synced)
    Decision -->|Yes Status: in_progress/completed| LoadResponse
    LoadResponse --> InitMixed
    InitMixed --> FormUI
    
    %% Notes
    note_new["Use prelist_data as default values.<br/>User starts fresh."]
    note_exist["Use response_data as primary values.<br/>Fill missing keys from prelist_data (optional)."]
    
    note_new -.-> InitPrelist
    note_exist -.-> InitMixed
```

## Penjelasan Alur

### 1. Sync Context (Parameterisasi)
Agar data yang diambil sesuai dengan aplikasi yang sedang dibuka, parameter context sangat penting saat melakukan permintaan ke server (API).
*   **Assignments**: Menggunakan filter `form_id` (atau `app_schema_id`). Ini memastikan kita hanya mengambil tugas untuk aplikasi tersebut.
*   **Responses**: Sangat penting untuk juga memfilter `responses` berdasarkan `app_schema_id`. Jika tidak, kita mungkin menarik ribuan jawaban dari aplikasi lain yang tidak relevan, yang memperlambat sync dan memenuhi memori.

### 2. Pengutamaan Data (Priority Strategy)
Saat form dibuka (`FormView`), aplikasi harus menentukan data apa yang ditampilkan ke pengguna.

*   **Assignments Table**: Menyimpan `prelist_data`. Ini adalah data referensi statis dari server (misal: Nama, Alamat, NIK target). Data ini biasanya *tidak berubah* kecuali di-update admin.
*   **Responses Table**: Menyimpan `response_data`. Ini adalah *jawaban* yang diinput oleh enumerator (user).

**Logika Penggabungan (Merge Strategy):**
1.  **Cek Ketersediaan Response**: Query join `assignments` dan `responses` berdasarkan `assignment_id`.
2.  **Skenario A (Belum pernah dikerjakan / Status `assigned`)**:
    *   `response_data` adalah `NULL`.
    *   **Aksi**: Form diinisialisasi menggunakan `prelist_data`. Field form yang memiliki "name" sama dengan key di prelist akan otomatis terisi.
3.  **Skenario B (Sudah ada jawaban / Status `in_progress` atau `completed`)**:
    *   `response_data` tersedia (JSON).
    *   **Aksi**: Form diinisialisasi utamanya menggunakan `response_data`.
    *   *Opsional*: Jika ada field di form yang kosong di `response_data` tapi ada di `prelist_data`, aplikasi bisa melakukan fallback ke nilai prelist (Deep Merge), tapi *best practice*-nya adalah `response_data` dianggap sebagai *current state of truth*.

### 3. Status Response
*   **Synced (is_synced = 1)**: Data jawaban berasal dari server (hasil pull). Jika user mengedit ini, status berubah menjadi unsynced.
*   **Local Draft (is_synced = 0)**: Data jawaban baru disimpan lokal dan belum naik ke server. Data ini memiliki prioritas tertinggi dibanding data server saat ditampilkan.
