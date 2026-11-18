import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { pool } from "@/lib/db";
export const runtime = "nodejs";
export async function GET() {
  if (!await getAdminSession()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const r = await pool.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE' ORDER BY table_name"
    );
    return NextResponse.json({ tables: r.rows });
  } catch { return NextResponse.json({ error: "Gagal mengambil daftar tabel." }, { status: 500 }); }
}
