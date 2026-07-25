# Versioning SOP — Cerdas Project

> **Rule #1**: Jangan pernah manual bump `package.json` selama development. Biarkan Release Please yang melakukannya.

---

## Root Cause: Mengapa Versi Terputus

Setup kita memiliki **dua sistem versioning** yang harus selaras:

| Sistem | File | Dikelola oleh |
|---|---|---|
| Release Please (GitHub tag) | `.release-please-manifest.json` | Otomatis via CI |
| Internal package version | `apps/client/package.json` | **Harus otomatis via Release Please** |

`release-please-config.json` sudah dikonfigurasi dengan `extra-files` yang include `apps/client/package.json`. Artinya Release Please **AKAN** update `package.json` saat PR di-merge — **TAPI HANYA JIKA** kita tidak manual bump sebelumnya.

### Apa yang terjadi jika manual bump:

```
Manifest says: 0.2.42
Manual bump:   package.json → 0.2.49 (selama development)

Release Please PR buat:
  .release-please-manifest.json: 0.2.42 → 0.2.43
  apps/client/package.json:      0.2.49 → 0.2.43  ← mundur!
```

Release Please membaca **manifest** sebagai source of truth, bukan `package.json`.
Jadi dia selalu bump dari manifest, dan menimpa `package.json` yang di-manual.

---

## Aturan Wajib

### ✅ BOLEH
- Commit dengan conventional commits: `fix(client): ...`, `feat(client): ...`
- Merge Release Please PR untuk trigger release & APK build
- Baca `package.json` untuk cek versi saat ini

### ❌ DILARANG
- Manual edit angka versi di `apps/client/package.json`
- Manual edit angka versi di `.release-please-manifest.json`
- Manual create GitHub tag (akan konflik dengan Release Please)
- Jalankan `npm version patch` atau sejenisnya

---

## Alur yang Benar (Industry Standard)

```
Development Loop:
  1. Code changes
  2. git commit -m "fix(client): ..."   ← conventional commit
  3. git push
  4. Release Please otomatis update PR  ← akumulasi semua commit

Release Loop:
  5. Merge Release Please PR di GitHub
     → manifest + package.json diupdate otomatis
     → GitHub Release dibuat
     → build-android.yml ter-trigger
     → APK di-upload ke GitHub Release
```

### Conventional Commits → Bump Type

| Commit prefix | Bump |
|---|---|
| `fix:` / `fix(scope):` | patch (0.2.42 → 0.2.43) |
| `feat:` / `feat(scope):` | minor (0.2.x → 0.3.0) |
| `feat!:` atau `BREAKING CHANGE:` | major (0.x.y → 1.0.0) |
| `chore:`, `docs:`, `refactor:` | tidak ada bump |

---

## Cara Sinkronisasi Jika Sudah Disconnect

### Option A: Biarkan Release Please Menang (Recommended)
```bash
# Release Please PR akan set package.json ke versinya sendiri.
# Ini TIDAK masalah — APK tetap berisi semua kode terbaru.
GITHUB_TOKEN="" gh pr merge <PR_NUMBER> --merge --repo ihkaru/cerdas
```

### Option B: Update Manifest Secara Manual
```bash
# Jika perlu align ke versi package.json yang sudah di-bump manual:
echo '{ ".": "0.2.49" }' > .release-please-manifest.json
git add .release-please-manifest.json
git commit -m "chore: sync release-please manifest to 0.2.49"
git push
# Release Please PR berikutnya akan bump dari 0.2.49 → 0.2.50
```

---

## `public/version.json` — Tidak Perlu Disentuh Manual

Script `version-gen` di `build` otomatis baca `package.json`:

```
Release Please update package.json → 0.2.43
pnpm build runs version-gen
version-gen baca package.json → 0.2.43
public/version.json: { "version": "0.2.43" } ✅
```

---

## Cara Cek Status Saat Ini

```bash
# Source of truth Release Please
cat .release-please-manifest.json

# Versi package client
cat apps/client/package.json | grep '"version"'

# Open Release PR
GITHUB_TOKEN="" gh pr list --repo ihkaru/cerdas --label "autorelease: pending"

# Workflow runs terbaru
GITHUB_TOKEN="" gh run list --repo ihkaru/cerdas --limit 5

# Release terbaru
GITHUB_TOKEN="" gh release view --repo ihkaru/cerdas
```

---

## Referensi

- [Release Please Documentation](https://github.com/googleapis/release-please)
- [Conventional Commits Spec](https://www.conventionalcommits.org/)
- `release-please-config.json` — konfigurasi di repo ini
- `.release-please-manifest.json` — source of truth versi saat ini
- `CHANGELOG.md` — auto-generated changelog
