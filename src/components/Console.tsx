"use client";
import { useEffect, useState } from "react";

type TableInfo={table_name:string};
type Result={columns:string[];rows:Record<string,unknown>[];rowCount:number;command:string};
export default function Console({username}:{username:string}) {
  const [tables,setTables]=useState<TableInfo[]>([]);
  const [active,setActive]=useState("overview");
  const [sql,setSql]=useState("SELECT current_database() AS database, current_user AS user, NOW() AS server_time;");
  const [result,setResult]=useState<Result|null>(null);
  const [message,setMessage]=useState(""); const [busy,setBusy]=useState(false);
  const [tableData,setTableData]=useState<Result|null>(null); const [selected,setSelected]=useState("");
  async function loadTables(){const r=await fetch("/api/tables");if(r.ok){const d=await r.json();setTables(d.tables||[]);}}
  useEffect(()=>{loadTables();},[]);
  async function runSql(){if(!sql.trim())return;if(!confirm("Jalankan SQL ini pada database Railway? Pastikan query sudah benar."))return;
    setBusy(true);setMessage("");setResult(null);
    try{const r=await fetch("/api/query",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({sql})});const d=await r.json();if(!r.ok)throw new Error(d.error||"Query gagal");setResult(d.result);setMessage("Query berhasil dijalankan.");await loadTables();}
    catch(e){setMessage(e instanceof Error?e.message:"Query gagal");}finally{setBusy(false);}
  }
  async function openTable(name:string){setSelected(name);setActive("tables");setTableData(null);
    const r=await fetch("/api/table?name="+encodeURIComponent(name));const d=await r.json();if(r.ok)setTableData(d.result);else setMessage(d.error||"Gagal membaca tabel");}
  async function logout(){await fetch("/api/logout",{method:"POST"});location.href="/login";}
  return <main className="shell">
    <div className="top"><div><div className="brand">NEXA<span>DB</span></div><div className="hint">POSTGRESQL MANAGEMENT CONSOLE</div></div><div style={{display:"flex",gap:10,alignItems:"center"}}><span className="tag">● CONNECTED SESSION</span><button className="btn" onClick={logout}>Logout · {username}</button></div></div>
    <div className="layout"><aside className="side"><small>Workspace</small><button className={"nav "+(active==="overview"?"active":"")} onClick={()=>setActive("overview")}>◫ &nbsp; Overview</button><button className={"nav "+(active==="tables"?"active":"")} onClick={()=>setActive("tables")}>▤ &nbsp; Tables</button><button className={"nav "+(active==="sql"?"active":"")} onClick={()=>setActive("sql")}>⌘ &nbsp; SQL Editor</button><small style={{marginTop:22}}>Database tables</small>{tables.map(t=><button key={t.table_name} className="nav" onClick={()=>openTable(t.table_name)}>▦ &nbsp; {t.table_name}</button>)}</aside>
    <section className="main">
      <div className="heading"><div><div className="eyebrow">WORKSPACE / POSTGRESQL</div><h1 className="h1">{active==="overview"?"Overview":active==="tables"?"Table explorer":"SQL editor"}</h1><div className="sub">Kelola database Railway dari satu tempat.</div></div><button className="btn" onClick={loadTables}>↻ Refresh</button></div>
      {active==="overview"&&<><div className="grid"><div className="card"><div className="metric">Visible tables</div><div className="value">{tables.length}</div></div><div className="card"><div className="metric">Database engine</div><div className="value" style={{fontSize:22}}>PostgreSQL</div></div><div className="card"><div className="metric">Access level</div><div className="value" style={{fontSize:22,color:"var(--accent)"}}>ADMIN</div></div></div><div className="card"><div className="cardtitle">Database tables</div>{tables.length?tables.map(t=><div className="row" key={t.table_name}><span className="mono">▦ &nbsp; {t.table_name}</span><button className="btn" onClick={()=>openTable(t.table_name)}>Browse →</button></div>):<div className="empty">Belum ada tabel yang ditemukan.</div>}</div></>}
      {active==="tables"&&<div className="card"><div className="cardtitle">Table browser {selected&&<span className="tag" style={{marginLeft:8}}>{selected}</span>}</div>{!selected?<div className="empty">Pilih tabel dari sidebar untuk melihat datanya.</div>:!tableData?<div className="empty">Memuat data...</div>:<><div className="hint" style={{marginBottom:12}}>Menampilkan maksimal 100 baris pertama.</div><div className="tablewrap"><table><thead><tr>{tableData.columns.map(c=><th key={c}>{c}</th>)}</tr></thead><tbody>{tableData.rows.map((row,i)=><tr key={i}>{tableData.columns.map(c=><td key={c}>{String(row[c]??"NULL")}</td>)}</tr>)}</tbody></table></div></>}</div>}
      {active==="sql"&&<div className="card"><div className="cardtitle">SQL Workspace <span className="tag" style={{marginLeft:8}}>ADMIN ONLY</span></div><p className="hint">Query dijalankan langsung ke Railway PostgreSQL. Query perubahan data atau struktur bersifat permanen. Gunakan transaksi dan backup sebelum operasi besar.</p><textarea spellCheck={false} value={sql} onChange={e=>setSql(e.target.value)}/><div className="toolbar"><button className="btn primary" onClick={runSql} disabled={busy}>{busy?"Running...":"▶ Run query"}</button><button className="btn" onClick={()=>{setSql("SELECT * FROM users LIMIT 50;");}}>Example: users</button></div>{message&&<p className={message.includes("berhasil")?"success":"error"}>{message}</p>}{result&&<><div className="row"><span className="status">{result.command} · {result.rowCount} row(s)</span></div>{result.columns.length>0&&<div className="tablewrap"><table><thead><tr>{result.columns.map(c=><th key={c}>{c}</th>)}</tr></thead><tbody>{result.rows.map((row,i)=><tr key={i}>{result.columns.map(c=><td key={c}>{String(row[c]??"NULL")}</td>)}</tr>)}</tbody></table></div>}</>}</div>}
      <p className="hint" style={{marginTop:18}}>NexaDB starter · Semua kredensial database disimpan di server, bukan browser.</p>
    </section></div>
  </main>;
}
