# Product Requirements Document (PRD): Sistem Keuangan Karang Taruna MMGM

## 1. Ringkasan Eksekutif
Aplikasi web serverless untuk digitalisasi buku kas manual Karang Taruna MMGM. Sistem melacak 3 jenis iuran bulanan (Kas, Dana Sosial, Arisan) untuk 20-30 anggota aktif, mengelola pengeluaran (Kas & Danasos), dan menghitung tunggakan serta saldo aktual secara dinamis (termasuk logika subsidi silang). Harus 100% Mobile-Friendly (Responsive UI) dan di-deploy gratis di Vercel.

## 2. Manajemen Pengguna & Hak Akses (RBAC)
Sistem menggunakan pola Public-Read / Private-Write.
- **Anggota (Public):** Tidak memiliki akun/login. Akses dashboard melalui Shared PIN statis (Cookie/Middleware). Hanya berhak melihat (Read-only) seluruh rekapitulasi data.
- **Admin/PJ (Private):** Login menggunakan Username & Password (JWT/Supabase Auth). 
  - `SUPER_ADMIN`: Akses CRUD penuh ke semua modul.
  - `PJ_KAS`: Akses CRUD hanya pada modul KAS (Pemasukan & Pengeluaran).
  - `PJ_DANASOS`: Akses CRUD hanya pada modul DANA SOSIAL (Pemasukan & Pengeluaran).
  - `PJ_ARISAN`: Akses CRUD hanya pada modul ARISAN (Hanya Pemasukan, tidak ada pengeluaran).

## 3. Fitur Utama & Antarmuka (UI/UX)
- **Multi-Tab Navigation:** UI dibagi menjadi 4 Tab (Tab 1: Rekapitulasi Global, Tab 2: Kas, Tab 3: Danasos, Tab 4: Arisan).
- **Matrix Ledger (Buku Kas UI):** Halaman iuran menampilkan tabel matriks (Baris = Nama Anggota, Kolom = Bulan 1-12). 
  - Mobile UI: Tabel dibungkus dalam div dengan `overflow-x-auto` agar bisa di-scroll horizontal tanpa merusak layout. Kolom nama harus *sticky left*.
- **Optimistic Auto-Save:** Saat PJ mencentang/menghapus centang (uncheck) pada bulan tertentu, UI langsung merespons (hijau/kosong) sementara request API berjalan di *background*. Menggunakan metode *Hard Delete* saat *uncheck*.

## 4. Logika Finansial Kritis (Wajib Diikuti)
- **Kewajiban Iuran:** Dihitung dinamis (Difference in Months) antara Tanggal Hari Ini dengan `join_date` dari entitas `Member`. Dilarang membuat baris kosong (*dummy rows*) di database.
- **Cross-Entity Subsidized Bailout (Subsidi Silang Arisan):** Jika ada anggota yang menunggak Arisan, Kas organisasi otomatis menalanginya.
- **Rumus Saldo Kas Aktual:** `(Total Pemasukan KAS) - (Total Pengeluaran KAS) - (Total Tunggakan Arisan Keseluruhan * Rp 10.000)`.
- **Rumus Saldo Danasos Aktual:** `(Total Pemasukan DANASOS) - (Total Pengeluaran DANASOS)`.