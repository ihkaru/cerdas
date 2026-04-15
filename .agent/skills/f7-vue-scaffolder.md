---
name: f7-vue-scaffolder
description: >
  Membangun, menstrukturkan, dan merefactor antarmuka pengguna menggunakan Framework7 Vue (v9.x).
  Gunakan skill ini setiap kali ada permintaan yang berkaitan dengan komponen UI mobile seperti
  halaman baru, navbar, panel navigasi, list, form input, modal, tab, toolbar, card, atau elemen
  interaktif lainnya dalam proyek Vue.js berbasis Framework7. Gunakan juga saat membutuhkan
  scaffolding halaman baru dari route, atau saat memperbaiki struktur layout hierarki F7 yang salah.
  Trigger: "buat halaman", "tambah komponen", "bikin form", "navigasi", "panel", "modal",
  "tab bar", "toolbar", "f7-", "framework7", "mobile UI".
---

# Framework7 Vue v9 Scaffolder

Panduan lengkap untuk menghasilkan kode Vue 3 yang valid dengan komponen `<f7-*>` dari Framework7 v9.

**Versi target:** `framework7-vue@9.0.3`  
**Docs:** https://framework7.io/vue/

---

## 1. Layout Hierarchy (WAJIB DITAATI)

Ini adalah hierarki yang harus selalu diikuti. Melanggar urutan ini akan menyebabkan router dan
animasi transisi rusak:

```
<f7-app>                          ← Root tunggal, hanya satu per aplikasi
  <f7-panel left|right>           ← (opsional) Side drawer/panel
  <f7-view main>                  ← Container utama untuk routing
    <f7-page>                     ← Setiap "layar" adalah sebuah page
      <f7-navbar />               ← Header navigasi (paling atas di dalam page)
      <f7-toolbar bottom />       ← Footer bar (opsional, bisa jadi tabbar)
      <!-- Konten di sini -->
      <f7-block>
      <f7-list>
      ...
    </f7-page>
  </f7-view>
</f7-app>
```

**Aturan absolut:**
- Semua konten visual HARUS ada di dalam `<f7-page>`.
- `<f7-navbar>` SELALU menjadi anak langsung pertama dari `<f7-page>`.
- `<f7-view main>` diperlukan untuk routing berbasis halaman bekerja.
- Jangan pernah meletakkan konten langsung di `<f7-app>` atau `<f7-view>`.

---

## 2. Komponen Inti & Penggunaannya

### Halaman & Navigasi
```vue
<!-- Halaman dengan back navigation -->
<f7-page>
  <f7-navbar title="Judul Halaman" back-link="Kembali" />
  <!-- konten -->
</f7-page>

<!-- Halaman root (tidak ada back link) -->
<f7-page>
  <f7-navbar title="Home" />
  <!-- konten -->
</f7-page>
```

### Block & List (Konten Utama)
```vue
<!-- Blok teks/konten umum -->
<f7-block>Paragraf atau konten bebas di sini.</f7-block>
<f7-block-title>Judul Section</f7-block-title>

<!-- List standar -->
<f7-list>
  <f7-list-item title="Item 1" />
  <f7-list-item title="Item 2" link="/detail/" />
</f7-list>

<!-- List dengan v-for -->
<f7-list strong inset>
  <f7-list-item
    v-for="item in items"
    :key="item.id"
    :title="item.name"
    :after="item.value"
  />
</f7-list>
```

### Form Inputs
```vue
<f7-list strong inset>
  <!-- Input teks -->
  <f7-list-input
    label="Nama"
    type="text"
    placeholder="Masukkan nama..."
    v-model:value="formData.name"
    clear-button
  />
  
  <!-- Input angka -->
  <f7-list-input
    label="Jumlah"
    type="number"
    placeholder="0"
    v-model:value="formData.amount"
  />
  
  <!-- Select / dropdown -->
  <f7-list-input
    label="Kategori"
    type="select"
    v-model:value="formData.category"
  >
    <option value="a">Pilihan A</option>
    <option value="b">Pilihan B</option>
  </f7-list-input>

  <!-- Textarea -->
  <f7-list-input
    label="Catatan"
    type="textarea"
    placeholder="Tulis catatan..."
    v-model:value="formData.notes"
    resizable
  />
</f7-list>
```

> **v9 breaking change:** Gunakan `v-model:value` bukan `v-model` untuk `<f7-list-input>`.

### Tombol
```vue
<!-- Tombol biasa -->
<f7-button @click="handleAction">Klik Saya</f7-button>

<!-- Tombol fill (solid) - untuk aksi utama -->
<f7-button fill large @click="submit">Simpan</f7-button>

<!-- Tombol outline -->
<f7-button outline @click="cancel">Batal</f7-button>

<!-- Tombol dalam block, full width -->
<f7-block>
  <f7-button fill large @click="saveData">Simpan Konfigurasi</f7-button>
</f7-block>

<!-- Segmented button group -->
<f7-segmented>
  <f7-button :active="tab === 'a'" @click="tab = 'a'">Tab A</f7-button>
  <f7-button :active="tab === 'b'" @click="tab = 'b'">Tab B</f7-button>
</f7-segmented>
```

### Panel (Side Drawer)
```vue
<!-- Di dalam <f7-app>, sebelum <f7-view> -->
<f7-panel left cover>
  <f7-navbar title="Menu" />
  <f7-list>
    <f7-list-item title="Dashboard" panel-close link="/" />
    <f7-list-item title="Pengaturan" panel-close link="/settings/" />
  </f7-list>
</f7-panel>

<!-- Tombol untuk membuka panel -->
<f7-button panel-open="left">Buka Menu</f7-button>
<!-- Atau di navbar: -->
<f7-navbar title="App">
  <template #left>
    <f7-link panel-open="left" icon-f7="menu" />
  </template>
</f7-navbar>
```

### Toolbar / Tabbar
```vue
<!-- Toolbar bawah sebagai tab bar -->
<f7-toolbar tabbar bottom>
  <f7-link tab-link="#tab-home" tab-link-active icon-f7="house" text="Home" />
  <f7-link tab-link="#tab-chart" icon-f7="chart_bar" text="Grafik" />
  <f7-link tab-link="#tab-settings" icon-f7="gear" text="Pengaturan" />
</f7-toolbar>
```

### Card
```vue
<f7-card>
  <f7-card-header>Judul Card</f7-card-header>
  <f7-card-content>
    <p>Konten card di sini.</p>
  </f7-card-content>
  <f7-card-footer>
    <f7-button>Aksi</f7-button>
  </f7-card-footer>
</f7-card>
```

### Toast & Dialog (Feedback ke User)
```vue
<script setup>
import { f7 } from 'framework7-vue';

// Toast ringan
const showToast = () => {
  f7.toast.create({ text: 'Tersimpan!', closeTimeout: 2000 }).open();
};

// Dialog konfirmasi
const confirmDelete = () => {
  f7.dialog.confirm('Yakin ingin menghapus?', () => {
    // lakukan penghapusan
  });
};

// Preloader (loading indicator)
const loadData = async () => {
  f7.preloader.show();
  await fetchData();
  f7.preloader.hide();
};
</script>
```

### Toggle & Range (untuk parameter kontrol)
```vue
<!-- Toggle switch -->
<f7-list>
  <f7-list-item title="Aktifkan Fitur">
    <template #after>
      <f7-toggle v-model:checked="featureEnabled" />
    </template>
  </f7-list-item>
</f7-list>

<!-- Range slider -->
<f7-block-title>Tingkat Inflasi: {{ inflationRate }}%</f7-block-title>
<f7-block>
  <f7-range
    v-model:value="inflationRate"
    :min="0"
    :max="20"
    :step="0.5"
    label
  />
</f7-block>
```

---

## 3. Routing (Router Component Pattern)

Halaman yang dirender via router menggunakan format ini:

```vue
<!-- src/pages/Dashboard.vue -->
<template>
  <f7-page>
    <f7-navbar title="Dashboard" back-link="Kembali" />
    <f7-block>
      <p>Konten halaman ini.</p>
    </f7-block>
  </f7-page>
</template>

<script setup>
// $f7route dan $f7router tersedia via inject / useStore / props
// Untuk navigasi programatik:
import { f7 } from 'framework7-vue';
const goBack = () => f7.views.main.router.back();
const goToDetail = (id) => f7.views.main.router.navigate(`/detail/${id}/`);
</script>
```

```js
// routes.js
const routes = [
  { path: '/', component: () => import('./pages/Home.vue') },
  { path: '/dashboard/', component: () => import('./pages/Dashboard.vue') },
  { path: '/settings/', component: () => import('./pages/Settings.vue') },
];
```

---

## 4. Framework7 API (f7 instance)

Akses `f7` di luar lifecycle:
```js
import { f7, f7ready } from 'framework7-vue';

// Gunakan f7ready di onMounted jika inisialisasi belum pasti selesai
onMounted(() => {
  f7ready(() => {
    // f7 sudah pasti siap
    f7.dialog.alert('Siap!');
  });
});
```

---

## 5. Anti-Patterns (JANGAN LAKUKAN)

| ❌ Salah | ✅ Benar |
|---|---|
| `<div class="button">` | `<f7-button>` |
| `<ul><li>` untuk list | `<f7-list><f7-list-item>` |
| Konten langsung di `<f7-view>` | Bungkus dalam `<f7-page>` |
| Mix Tailwind/Vuetify di file yang sama | Gunakan hanya F7 + class utility F7 |
| `v-model="val"` di `f7-list-input` | `v-model:value="val"` (v9) |
| `v-model="checked"` di `f7-toggle` | `v-model:checked="checked"` (v9) |
| `<f7-navbar>` di luar `<f7-page>` | `<f7-navbar>` sebagai anak langsung `<f7-page>` |
| `import { Swiper }` dari framework7-vue | Gunakan Swiper Custom Element (v9 breaking change) |

---

## 6. Contoh Lengkap: Halaman Kontrol Parameter Simulasi

Pola standar untuk proyek yang memerlukan form kontrol + simpan ke backend:

```vue
<template>
  <f7-page>
    <f7-navbar title="Parameter Simulasi" back-link="Kembali" />

    <f7-block-title>Kebijakan Moneter</f7-block-title>
    <f7-list strong inset>
      <f7-list-input
        label="Suku Bunga Acuan (%)"
        type="number"
        placeholder="5.0"
        v-model:value="params.interestRate"
        clear-button
      />
      <f7-list-input
        label="Rasio Cadangan Minimum (%)"
        type="number"
        placeholder="8.0"
        v-model:value="params.reserveRatio"
        clear-button
      />
    </f7-list>

    <f7-block-title>Kebijakan Fiskal</f7-block-title>
    <f7-list strong inset>
      <f7-list-input
        label="Tarif Pajak (%)"
        type="number"
        v-model:value="params.taxRate"
      />
      <f7-list-item title="Stimulus Aktif">
        <template #after>
          <f7-toggle v-model:checked="params.stimulusEnabled" />
        </template>
      </f7-list-item>
    </f7-list>

    <f7-block-title>Kecepatan Pertumbuhan Populasi</f7-block-title>
    <f7-block>
      <f7-range
        v-model:value="params.populationGrowth"
        :min="0" :max="5" :step="0.1"
        label
      />
      <p class="text-align-center">{{ params.populationGrowth }}% per tahun</p>
    </f7-block>

    <f7-block>
      <f7-button fill large @click="saveParams">
        Simpan & Jalankan Simulasi
      </f7-button>
    </f7-block>
  </f7-page>
</template>

<script setup>
import { reactive } from 'vue';
import { f7 } from 'framework7-vue';

const params = reactive({
  interestRate: 5.0,
  reserveRatio: 8.0,
  taxRate: 20.0,
  stimulusEnabled: false,
  populationGrowth: 1.5,
});

const saveParams = async () => {
  f7.preloader.show();
  try {
    await fetch('/api/simulation/params', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    f7.toast.create({ text: 'Parameter tersimpan!', closeTimeout: 2000 }).open();
    f7.views.main.router.back();
  } catch (e) {
    f7.dialog.alert('Gagal menyimpan: ' + e.message);
  } finally {
    f7.preloader.hide();
  }
};
</script>
```

---

## 7. Quick Reference: Komponen ke Use Case

| Use Case | Komponen F7 |
|---|---|
| Header halaman | `<f7-navbar>` |
| Footer / tab navigasi | `<f7-toolbar tabbar bottom>` + `<f7-link tab-link>` |
| Drawer menu kiri/kanan | `<f7-panel left|right>` |
| List data | `<f7-list>` + `<f7-list-item>` |
| Form input | `<f7-list>` + `<f7-list-input>` |
| Tombol aksi | `<f7-button fill>` |
| Toggle on/off | `<f7-toggle>` |
| Slider nilai | `<f7-range>` |
| Kartu konten | `<f7-card>` |
| Notifikasi singkat | `f7.toast.create()` |
| Dialog konfirmasi | `f7.dialog.confirm()` |
| Loading state | `f7.preloader.show/hide()` |
| Modal bawah | `<f7-sheet>` |
| Popup overlay | `<f7-popup>` |
| Data tabular | `<f7-data-table>` |
| Chart area/pie | `<f7-area-chart>` / `<f7-pie-chart>` |

---

**Docs lengkap per komponen:** https://framework7.io/vue/[nama-komponen]  
Contoh: https://framework7.io/vue/list-item.html

## 8. Theming
```vue
Color Properties
All Framework7-Vue components supports same set of color properties that allow to set separate element colors and color themes:

Prop	Type	Default	Description
color	string		Single element color. One of the default colors.
color-theme	string		Applies color theme to the element. It should be some parent element as this will have visual effect on all supported children elements, e.g. view, page, navbar, toolbar, list, etc. One of the default colors.
text-color	string		Sets element's text color. One of the default colors.
bg-color	string		Sets element's background color. One of the default colors.
border-theme	string		Sets element's borders color. One of the default colors.
ripple-color	string		Sets element ripple wave color. One of the default colors.
dark	boolean	false	Enables dark layout theme on element. It should be some parent element as this will have visual effect on all supported children elements, e.g. view, page, navbar, toolbar, list, etc.
For example:

<!-- Button color -->
<f7-button color="red">Red Button</f7-button>

<!-- Link color -->
<f7-link color="green">Green Link</f7-link>

<!-- Page color theme -->
<f7-page color-theme="orange">
  ...
</f7-page>

<!-- Panel with dark theme -->
<f7-panel dark>
  ...
</f7-panel>

        square_on_square
        checkmark_alt
      
color-themes.vue

logo_apple

logo_android

sun_max_fill

moon_fill
<template>
  <f7-page>
    <f7-navbar large title="Color Themes" back-link>
      <template #right>
        <f7-link>Link</f7-link>
      </template>
    </f7-navbar>
    <f7-toolbar tabbar icons bottom>
      <f7-toolbar-pane>
        <f7-link
          tab-link="#tab-1"
          tab-link-active
          text="Tab 1"
          icon-ios="f7:envelope_fill"
          icon-md="material:email"
        />
        <f7-link
          tab-link="#tab-2"
          text="Tab 2"
          icon-ios="f7:calendar_fill"
          icon-md="material:today"
        />
        <f7-link
          tab-link="#tab-3"
          text="Tab 3"
          icon-ios="f7:cloud_upload_fill"
          icon-md="material:file_upload"
        />
      </f7-toolbar-pane>
    </f7-toolbar>
    <f7-block-title medium>Layout Themes</f7-block-title>
    <f7-block strong inset>
      <p>Framework7 comes with 2 main layout themes: Light (default) and Dark:</p>
      <div class="grid grid-cols-2 grid-gap">
        <div class="bg-color-white demo-theme-picker" @click="setLayoutTheme('light')">
          <f7-checkbox v-if="theme === 'light'" checked disabled />
        </div>
        <div class="bg-color-black demo-theme-picker" @click="setLayoutTheme('dark')">
          <f7-checkbox v-if="theme === 'dark'" checked disabled />
        </div>
      </div>
    </f7-block>

    <f7-block-title medium>Default Color Themes</f7-block-title>
    <f7-block strong inset>
      <p>Framework7 comes with {{ colors.length }} color themes set.</p>
      <div class="grid grid-cols-3 medium-grid-cols-4 large-grid-cols-5 grid-gap">
        <div v-for="(color, index) in colors" :key="index">
          <f7-button
            fill
            round
            small
            class="demo-color-picker-button"
            :color="color"
            @click="setColorTheme(color)"
            >{{ color }}</f7-button
          >
        </div>
      </div>
    </f7-block>
    <f7-block-title medium>Material Color Scheme</f7-block-title>
    <f7-list strong inset dividers-ios>
      <f7-list-item title="Monochrome">
        <template #after>
          <f7-toggle
            :checked="monochrome"
            @toggle:change="() => setMdColorSchemeMonochrome(!monochrome)"
          />
        </template>
      </f7-list-item>
      <f7-list-item title="Vibrant">
        <template #after>
          <f7-toggle :checked="vibrant" @toggle:change="() => setMdColorSchemeVibrant(!vibrant)" />
        </template>
      </f7-list-item>
    </f7-list>
    <f7-block-title medium>Custom Color Theme</f7-block-title>
    <f7-list strong inset>
      <f7-list-input
        type="colorpicker"
        label="HEX Color"
        placeholder="e.g. #ff0000"
        readonly
        :value="{ hex: themeColor }"
        :color-picker-params="{ targetEl: '#color-theme-picker-color' }"
        @colorpicker:change="(value) => setCustomColor(value.hex)"
      >
        <template #media>
          <div
            id="color-theme-picker-color"
            style="
              width: 28px;
              height: 28px;
              border-radius: 4px;
              background: var(--f7-color-primary);
            "
          ></div>
        </template>
      </f7-list-input>
    </f7-list>
  </f7-page>
</template>
<script>
import {
  f7Navbar,
  f7Page,
  f7BlockTitle,
  f7Button,
  f7Block,
  f7List,
  f7ListInput,
  f7ListItem,
  f7Checkbox,
  f7Link,
  f7Toolbar,
  f7ToolbarPane,
  f7Toggle,
  f7,
} from 'framework7-vue';
import $ from 'dom7';
import { ref } from 'vue';

let globalTheme = 'light';
let globalThemeColor = $('html').css('--f7-color-primary').trim();

export default {
  components: {
    f7Navbar,
    f7Page,
    f7BlockTitle,
    f7Button,
    f7Block,
    f7List,
    f7ListInput,
    f7ListItem,
    f7Checkbox,
    f7Link,
    f7Toolbar,
    f7ToolbarPane,
    f7Toggle,
  },
  setup() {
    if (!globalThemeColor) {
      globalThemeColor = $('html').css('--f7-color-primary').trim();
    }
    const monochrome = ref(false);
    const vibrant = ref(false);
    const theme = ref(globalTheme);
    const themeColor = ref(globalThemeColor);

    const colors = Object.keys(f7.colors).filter(
      (c) => c !== 'primary' && c !== 'white' && c !== 'black',
    );

    const setLayoutTheme = (newTheme) => {
      f7.setDarkMode(newTheme === 'dark');
      globalTheme = newTheme;
      theme.value = newTheme;
    };

    const setColorTheme = (newColor) => {
      globalThemeColor = f7.colors[newColor];
      themeColor.value = globalThemeColor;
      f7.setColorTheme(globalThemeColor);
    };

    const setCustomColor = (newColor) => {
      globalThemeColor = newColor;
      themeColor.value = globalThemeColor;
      f7.setColorTheme(globalThemeColor);
    };

    const setMdColorScheme = () => {
      if (!vibrant.value && !monochrome.value) {
        f7.setMdColorScheme('default');
      } else if (vibrant.value && !monochrome.value) {
        f7.setMdColorScheme('vibrant');
      } else if (!vibrant.value && monochrome.value) {
        f7.setMdColorScheme('monochrome');
      } else if (vibrant.value && monochrome.value) {
        f7.setMdColorScheme('monochrome-vibrant');
      }
    };

    const setMdColorSchemeMonochrome = (value) => {
      monochrome.value = value;
      setMdColorScheme();
    };

    const setMdColorSchemeVibrant = (value) => {
      vibrant.value = value;
      setMdColorScheme();
    };
    return {
      monochrome,
      vibrant,
      theme,
      themeColor,
      colors,
      setLayoutTheme,
      setColorTheme,
      setCustomColor,
      setMdColorScheme,
      setMdColorSchemeMonochrome,
      setMdColorSchemeVibrant,
    };
  },
};
</script>
```