import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { listTables } from "@/lib/db";
export const runtime = "nodejs";
export async function GET() {
  if (!await getAdminSession()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try { return NextResponse.json({ tables: await listTables() }); }
  catch { return NextResponse.json({ error: "Gagal mengambil daftar tabel." }, { status: 500 }); }
}
