Agar TypeScript benar-benar menjadi "senjata", bukan "beban" dalam pengembangan Vue.js, Anda perlu mengubah pola pikir dari sekadar "menulis kode" menjadi "membangun kontrak".

Berikut adalah prinsip-prinsip utama dan setup VS Code terkini (per 2025/2026) yang wajib Anda terapkan.

A. Prinsip TypeScript di Vue (The "Iron Rules")

1. "Boundary is King" (Props & Emits Wajib Strict)
   Ini adalah aturan terpenting. Batas antar komponen (Parent ke Child) harus dikunci rapat.

Jangan: Menggunakan props: ['user'] (style lama).

Lakukan: Gunakan Generic Type Argument di <script setup>.

TypeScript

// ChildComponent.vue

<script setup lang="ts">
// Definisikan bentuk data secara eksplisit
interface User {
  id: number;
  name: string;
  role: 'admin' | 'user'; // Union type (lebih baik dari string biasa)
}

// Dengan ini, Parent Component akan ERROR merah jika
// lupa mengirim props user, atau mengirim user tanpa id.
defineProps<{
  user: User;
  config?: { darkMode: boolean }; // Optional prop
}>();

// Emit juga harus di-type agar Parent tahu event apa yang keluar
// dan data apa yang dibawa.
const emit = defineEmits<{
  (e: 'update', id: number): void;
  (e: 'delete'): void;
}>();
</script>

2. Hindari any Seperti Wabah
   Menggunakan any sama dengan mematikan TypeScript. Jika Anda tidak tahu tipe datanya, gunakan unknown lalu lakukan validasi (narrowing), atau buat tipe parsial.

Prinsip: Lebih baik menghabiskan 5 menit mendefinisikan interface API Response daripada menghabiskan 2 jam debugging karena undefined is not a function.

3. Manfaatkan "Type Inference" (Jangan Over-Typing)
   TypeScript itu pintar. Jika Anda memberikan nilai default yang jelas, Anda tidak perlu menulis tipenya lagi.

Jangan: const count: number = ref<number>(0); (Redundan).

Lakukan: const count = ref(0); (TS otomatis tahu ini Ref<number>).

Pengecualian: Jika nilai awal null atau undefined, Anda wajib eksplisit:

TypeScript

const selectedUser = ref<User | null>(null); 4. Type Your API Responses (Zod / Manual)
Data dari backend adalah sumber ketidakpastian terbesar.

Lakukan: Selalu buat interface untuk respon API.

TypeScript

// api/types.ts
export interface ApiResponse<T> {
data: T;
status: number;
message: string;
}

// component
const fetchData = async (): Promise<User[]> => {
const res = await axios.get<ApiResponse<User[]>>('/users');
return res.data.data; // Autocomplete akan jalan di sini!
} 5. Discriminated Unions untuk State UI
Daripada menggunakan banyak boolean terpisah (isLoading, isError, isSuccess), gunakan satu state union. Ini mencegah state yang mustahil (misal: loading dan error true bersamaan).

TypeScript

type RequestState =
| { status: 'idle' }
| { status: 'loading' }
| { status: 'success'; data: User[] }
| { status: 'error'; error: Error };

const state = ref<RequestState>({ status: 'idle' });

// Saat akses data, TS akan memaksa Anda cek status dulu:
if (state.value.status === 'success') {
console.log(state.value.data); // Aman
}
