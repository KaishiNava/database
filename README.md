# NexaDB — Railway PostgreSQL Console

Starter web admin untuk melihat tabel dan menjalankan SQL pada PostgreSQL Railway.

## Fitur saat ini
- Login admin dari tabel `users` yang sudah ada.
- Session cookie HttpOnly, Secure (production), SameSite Strict, berlaku 8 jam.
- Dashboard dan daftar tabel schema `public`.
- Table browser (maksimal 100 baris).
- SQL editor admin-only.

## Prasyarat tabel users
Login mengharapkan tabel `public.users` dengan kolom:
- `id` (integer atau serial)
- `username` (varchar/text)
- `email` (varchar/text)
- `password` (bcrypt hash)
- `role` (text/varchar; admin untuk administrator)

Contoh cek:
```sql
SELECT id, username, email, role FROM users;
```

Jika tabelmu berbeda, sesuaikan query di `src/app/api/login/route.ts`.

## Setup
1. Buat repository GitHub dan upload seluruh isi folder ini.
2. Di Vercel, import repository.
3. Tambahkan Environment Variables:
   - `DATABASE_URL`: Railway PostgreSQL connection URL. Ambil dari Railway > PostgreSQL > Variables. Gunakan URL private/internal jika app berjalan di Railway; untuk Vercel gunakan Railway public connection URL yang disediakan untuk akses eksternal.
   - `SESSION_SECRET`: string acak rahasia minimal 32 karakter.
4. Deploy.
5. Buka domain Vercel lalu login memakai username/email dan password admin yang hash bcrypt-nya sudah ada di tabel `users`.

## Lokal (opsional)
```bash
npm install
cp .env.example .env.local
npm run dev
```

## Keamanan penting
- Jangan commit `.env.local` atau membagikan `DATABASE_URL`.
- SQL editor memberikan hak SQL penuh kepada admin yang berhasil login. Query seperti DROP/DELETE bersifat permanen.
- Untuk pemakaian serius, buat backup, aktifkan rate limit login, gunakan DB role khusus dengan privilege minimum, dan pertimbangkan audit log.
- Jangan gunakan akun database superuser untuk aplikasi publik. Buat role PostgreSQL khusus NexaDB dengan izin yang diperlukan.
- Vercel serverless dapat membuat beberapa koneksi. Pool dibatasi 5; gunakan Railway connection pooling jika tersedia.
