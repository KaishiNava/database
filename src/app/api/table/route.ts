import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { pool } from "@/lib/db";
export const runtime = "nodejs";
export async function GET(req: Request) {
  if (!await getAdminSession()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const name = new URL(req.url).searchParams.get("name");
  if (!name || !/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name)) return NextResponse.json({ error: "Nama tabel tidak valid." }, { status: 400 });
  try {
    const exists = await pool.query("SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name=$1", [name]);
    if (!exists.rowCount) return NextResponse.json({ error: "Tabel tidak ditemukan." }, { status: 404 });
    const safeName = '"' + name.replace(/"/g, '""') + '"';
    const result = await pool.query(`SELECT * FROM public.${safeName} LIMIT 100`);
    return NextResponse.json({ result: { columns: result.fields.map(f=>f.name), rows: result.rows, rowCount: result.rowCount ?? 0 } });
  } catch { return NextResponse.json({ error: "Gagal membaca tabel." }, { status: 500 }); }
}
