import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { dbEngine, query } from "@/lib/db";
export const runtime = "nodejs";
function authorized(req: Request) {
  const expected = process.env.NEXADB_API_KEY || "";
  const supplied = req.headers.get("x-api-key") || "";
  if (!expected || !supplied) return false;
  const a = Buffer.from(expected); const b = Buffer.from(supplied);
  return a.length === b.length && timingSafeEqual(a, b);
}
function tableAllowed(table: string) {
  const allowed = (process.env.API_TABLE_ALLOWLIST || "").split(",").map(x => x.trim()).filter(Boolean);
  return /^[A-Za-z_][A-Za-z0-9_]*$/.test(table) && allowed.includes(table);
}
function quote(name: string) { return dbEngine === "mysql" ? `\`${name}\`` : `"${name}"`; }
export async function GET(req: Request, ctx: { params: { table: string } }) {
  if (!authorized(req)) return NextResponse.json({ error: "API key tidak valid." }, { status: 401 });
  const table = ctx.params.table;
  if (!tableAllowed(table)) return NextResponse.json({ error: "Tabel tidak diizinkan. Atur API_TABLE_ALLOWLIST." }, { status: 403 });
  try {
    const url = new URL(req.url); const limit = Math.min(Math.max(Number(url.searchParams.get("limit") || 50), 1), 100); const id = url.searchParams.get("id");
    const sql = `SELECT * FROM ${dbEngine === "postgres" ? "public." : ""}${quote(table)}${id ? " WHERE id = $1" : ""} LIMIT ${limit}`;
    const r = await query(sql, id ? [id] : []); return NextResponse.json({ data: r.rows, count: r.rowCount });
  } catch { return NextResponse.json({ error: "Gagal membaca data." }, { status: 500 }); }
}
export async function POST(req: Request, ctx: { params: { table: string } }) {
  if (!authorized(req)) return NextResponse.json({ error: "API key tidak valid." }, { status: 401 });
  const table = ctx.params.table; if (!tableAllowed(table)) return NextResponse.json({ error: "Tabel tidak diizinkan." }, { status: 403 });
  try {
    const data = await req.json(); if (!data || Array.isArray(data) || typeof data !== "object") return NextResponse.json({ error: "Body harus berupa JSON object." }, { status: 400 });
    const keys = Object.keys(data); if (!keys.length || keys.some(k => !/^[A-Za-z_][A-Za-z0-9_]*$/.test(k))) return NextResponse.json({ error: "Nama kolom tidak valid." }, { status: 400 });
    const cols = keys.map(quote).join(", "); const placeholders = keys.map((_, i) => `$${i + 1}`).join(", ");
    const r = await query(`INSERT INTO ${dbEngine === "postgres" ? "public." : ""}${quote(table)} (${cols}) VALUES (${placeholders})`, keys.map(k => data[k]));
    return NextResponse.json({ ok: true, affected: r.rowCount }, { status: 201 });
  } catch { return NextResponse.json({ error: "Gagal menambahkan data. Periksa kolom dan tipe datanya." }, { status: 400 }); }
}
export async function PATCH(req: Request, ctx: { params: { table: string } }) {
  if (!authorized(req)) return NextResponse.json({ error: "API key tidak valid." }, { status: 401 });
  const table = ctx.params.table; if (!tableAllowed(table)) return NextResponse.json({ error: "Tabel tidak diizinkan." }, { status: 403 });
  try {
    const body = await req.json(); const { id, ...data } = body || {}; const keys = Object.keys(data);
    if (id === undefined || !keys.length || keys.some(k => !/^[A-Za-z_][A-Za-z0-9_]*$/.test(k))) return NextResponse.json({ error: "Sertakan id dan kolom yang ingin diubah." }, { status: 400 });
    const sets = keys.map((k, i) => `${quote(k)} = $${i + 1}`).join(", ");
    const r = await query(`UPDATE ${dbEngine === "postgres" ? "public." : ""}${quote(table)} SET ${sets} WHERE id = $${keys.length + 1}`, [...keys.map(k => data[k]), id]);
    return NextResponse.json({ ok: true, affected: r.rowCount });
  } catch { return NextResponse.json({ error: "Gagal memperbarui data." }, { status: 400 }); }
}
export async function DELETE(req: Request, ctx: { params: { table: string } }) {
  if (!authorized(req)) return NextResponse.json({ error: "API key tidak valid." }, { status: 401 });
  const table = ctx.params.table; if (!tableAllowed(table)) return NextResponse.json({ error: "Tabel tidak diizinkan." }, { status: 403 });
  const id = new URL(req.url).searchParams.get("id"); if (!id) return NextResponse.json({ error: "Parameter id wajib." }, { status: 400 });
  try { const r = await query(`DELETE FROM ${dbEngine === "postgres" ? "public." : ""}${quote(table)} WHERE id = $1`, [id]); return NextResponse.json({ ok: true, affected: r.rowCount }); }
  catch { return NextResponse.json({ error: "Gagal menghapus data." }, { status: 400 }); }
}
