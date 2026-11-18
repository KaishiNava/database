"use client";
import { useState } from "react";
export default function LoginForm() {
  const [identity,setIdentity]=useState(""); const [password,setPassword]=useState("");
  const [error,setError]=useState(""); const [busy,setBusy]=useState(false);
  async function submit(e:React.FormEvent){e.preventDefault();setBusy(true);setError("");
    try { const r=await fetch("/api/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({identity,password})});
      const d=await r.json(); if(!r.ok) throw new Error(d.error||"Login gagal"); location.href="/";
    } catch(err){setError(err instanceof Error?err.message:"Terjadi kesalahan");} finally{setBusy(false);}
  }
  return <form className="card login" onSubmit={submit}><div className="eyebrow">AUTHENTICATION / 01</div><h1 className="h1">Welcome back.</h1><p className="sub">Masuk menggunakan akun administrator database.</p><label className="hint">Username atau email</label><input className="input" value={identity} onChange={e=>setIdentity(e.target.value)} autoComplete="username" required/><label className="hint">Password</label><input className="input" type="password" value={password} onChange={e=>setPassword(e.target.value)} autoComplete="current-password" required/><button className="btn primary" style={{width:"100%",marginTop:8}} disabled={busy}>{busy?"Memeriksa...":"Sign in →"}</button>{error&&<p className="error">{error}</p>}<p className="hint" style={{marginTop:18}}>Akses dibatasi untuk akun dengan role <b>admin</b>.</p></form>;
}
