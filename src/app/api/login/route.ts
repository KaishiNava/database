import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { query } from "@/lib/db";
import { createSession } from "@/lib/auth";
export const runtime = "nodejs";
export async function POST(req: Request) {
  try {
    const { identity, password } = await req.json();
    if (typeof identity !== "string" || typeof password !== "string" || !identity || !password) return NextResponse.json({ error: "Username/email dan password wajib diisi." }, { status: 400 });
    const result = await query<{id:number;username:string;password:string;role:string}>("SELECT id, username, password, role FROM users WHERE username = $1 OR email = $1 LIMIT 1", [identity.trim()]);
    const user = result.rows[0];
    if (!user || user.role !== "admin" || !(await bcrypt.compare(password, user.password))) return NextResponse.json({ error: "Kredensial tidak valid atau bukan akun admin." }, { status: 401 });
    await createSession({ id: Number(user.id), username: user.username, role: user.role });
    return NextResponse.json({ ok: true });
  } catch { return NextResponse.json({ error: "Tidak dapat memproses login. Periksa konfigurasi database dan struktur tabel users." }, { status: 500 }); }
}
