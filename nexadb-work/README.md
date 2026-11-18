# NexaDB Pro — Multi-Database Console

NexaDB Pro adalah dashboard pengelolaan database dan REST API untuk menghubungkan bot, website, aplikasi akun, inventory, dan project lain ke satu sumber data.

## Engine yang didukung pada adapter saat ini

- PostgreSQL (termasuk Railway PostgreSQL)
- MySQL
- MariaDB

SQLite, MongoDB, Redis, SQL Server, dan Oracle belum didukung oleh adapter versi ini. Engine tersebut membutuhkan driver dan model query yang berbeda; jangan mengatur `DB_TYPE` ke engine yang belum didukung.

## Fitur

- Login admin memakai tabel `users` yang sudah ada (password bcrypt, role admin).
- Session cookie HttpOnly, Secure pada production, SameSite Strict, masa berlaku 8 jam.
- Overview database, statistik, table explorer, pencarian lokal, export CSV.
- SQL Studio untuk query pada engine aktif.
- REST API JSON dengan API key dan allowlist tabel.
- API CRUD untuk membaca, menambah, memperbarui, dan menghapus records.
- Video hero banner yang diminta.

## Setup Vercel + Railway PostgreSQL

1. Upload isi folder ini ke repository GitHub.
2. Import repository ke Vercel.
3. Tambahkan environment variables:
   - `DB_TYPE=postgres`
   - `DATABASE_URL`: Railway PostgreSQL public connection URL untuk aplikasi di Vercel.
   - `SESSION_SECRET`: random secret minimal 32 karakter.
   - `NEXADB_API_KEY`: random API key panjang untuk integrasi eksternal.
   - `API_TABLE_ALLOWLIST=bot_tokens,accounts` (sesuaikan nama tabel yang memang ingin dibuka lewat API).
4. Deploy.

Untuk MySQL/MariaDB, set `DB_TYPE=mysql` atau `DB_TYPE=mariadb` dan isi `DATABASE_URL` yang sesuai.

## Struktur tabel login

Login dashboard mengharapkan tabel `users` dengan kolom `id`, `username`, `email`, `password` (bcrypt hash), dan `role` (`admin` untuk administrator). Sesuaikan query `src/app/api/login/route.ts` jika struktur tabel berbeda.

## REST API dari bot / aplikasi lain

Semua endpoint berikut memerlukan header `x-api-key` dan tabel harus tercantum di `API_TABLE_ALLOWLIST`.

- `GET /api/v1/data/:table?limit=50` — baca records (maksimal 100).
- `POST /api/v1/data/:table` — insert JSON object.
- `PATCH /api/v1/data/:table` — update berdasarkan field `id` di body.
- `DELETE /api/v1/data/:table?id=123` — delete berdasarkan field `id`.

Contoh Node.js:

```js
const response = await fetch(`${process.env.NEXADB_URL}/api/v1/data/bot_tokens`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-api-key": process.env.NEXADB_API_KEY
  },
  body: JSON.stringify({ owner_id: 123456, token_encrypted: "..." })
});
const result = await response.json();
```

Simpan `NEXADB_API_KEY` hanya di backend bot/server, jangan di frontend atau repository publik. Jangan pernah mengirim password, token bot, session cookie, atau API key ke log. Data sensitif seperti token bot harus dienkripsi sebelum disimpan; endpoint CRUD generik tidak mengenkripsi field otomatis.

## Catatan keamanan dan batasan

- SQL Studio memberikan hak SQL penuh kepada admin. Query `DROP`, `DELETE`, dan `UPDATE` dapat mengubah data permanen.
- Gunakan database role khusus NexaDB dengan privilege minimum, bukan superuser.
- Batasi allowlist ke tabel yang benar-benar diperlukan; jangan masukkan tabel admin atau kredensial tanpa kebutuhan.
- API generik ini mengandalkan kolom `id` untuk update/delete. Buat primary key `id` pada tabel yang akan dikelola.
- API key saat ini satu shared key; untuk produksi multi-user sebaiknya tambahkan per-project keys, scopes, rate limiting, audit log, dan rotasi key.
- Buat backup sebelum perubahan skema atau penghapusan data.

## Contoh tabel untuk data bot dan akun (PostgreSQL)

```sql
CREATE TABLE bot_tokens (
  id BIGSERIAL PRIMARY KEY,
  owner_id BIGINT NOT NULL,
  token_encrypted TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE accounts (
  id BIGSERIAL PRIMARY KEY,
  username VARCHAR(80) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE,
  password_hash TEXT NOT NULL,
  status VARCHAR(24) NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

Simpan password akun sebagai hash Argon2id/bcrypt, bukan plaintext. Simpan token/API secret dalam bentuk terenkripsi (misalnya AES-256-GCM) sebelum dikirim ke API. Jangan menyimpan data sensitif dalam tabel yang masuk allowlist jika tidak perlu.
