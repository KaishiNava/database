import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { getTableRows } from "@/lib/db";
export const runtime = "nodejs";
export async function GET(req: Request) {
  if (!await getAdminSession()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const name = new URL(req.url).searchParams.get("name");
  if (!name || !/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name)) return NextResponse.json({ error: "Nama tabel tidak valid." }, { status: 400 });
  try { const result = await getTableRows(name); return result ? NextResponse.json({ result }) : NextResponse.json({ error: "Tabel tidak ditemukan." }, { status: 404 }); }
  catch { return NextResponse.json({ error: "Gagal membaca tabel." }, { status: 500 }); }
}
