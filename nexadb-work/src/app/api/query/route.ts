import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { query } from "@/lib/db";
export const runtime = "nodejs";
export async function POST(req: Request) {
  if (!await getAdminSession()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await req.json(); const sql = body?.sql;
    if (typeof sql !== "string" || !sql.trim() || sql.length > 20000) return NextResponse.json({ error: "Query kosong atau terlalu panjang (maksimal 20.000 karakter)." }, { status: 400 });
    const result = await query(sql);
    return NextResponse.json({ result: { columns: result.fields, rows: result.rows, rowCount: result.rowCount, command: result.command } });
  } catch (e) { return NextResponse.json({ error: e instanceof Error ? e.message : "SQL query gagal." }, { status: 400 }); }
}
