import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const secretValue = process.env.SESSION_SECRET;
if (!secretValue || secretValue.length < 32) {
  throw new Error("SESSION_SECRET wajib minimal 32 karakter.");
}
const secret = new TextEncoder().encode(secretValue);
const COOKIE = "nexadb_session";

export async function createSession(user: { id: number; username: string; role: string }) {
  const token = await new SignJWT({
    uid: user.id, username: user.username, role: user.role
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(secret);

  cookies().set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 8
  });
}

export async function getAdminSession() {
  const token = cookies().get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    if (payload.role !== "admin" || typeof payload.uid !== "number") return null;
    return { id: payload.uid, username: String(payload.username ?? "admin") };
  } catch {
    return null;
  }
}

export function clearSession() {
  cookies().delete(COOKIE);
}
