import { useMemo, useState } from "react";
import Head from "next/head";

const TELEGRAM_URL = "https://t.me/Saeed2578"; // <- put your link

function fmtMobile(s) {
  const str = String(s || "");
  // +92 3xx xxxxxx (basic pretty)
  return str.replace(/^\+?92(\d{3})(\d{7})$/, "+92 $1 $2");
}

export default function Home() {
  const [number, setNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  const isValid = useMemo(() => /^03\d{9}$/.test(number), [number]);

  async function handleCheck() {
    setError(""); setStatus(null); setData(null);
    if (!isValid) { setError("Please enter a valid number (e.g., 03xxxxxxxxx)."); return; }

    setLoading(true);
    try {
      const res = await fetch(`/api/simdata?num=${encodeURIComponent(number)}`);
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || "Failed to fetch data");
      setStatus(json.status || null);
      setData(json.data ?? null);
    } catch (e) {
      setError(e.message || "Request failed");
    } finally {
      setLoading(false);
    }
  }

  const isArrayOfObjects = Array.isArray(data) && data.every(r => r && typeof r === "object");
  const kvRows = useMemo(() => {
    if (!data || Array.isArray(data)) return [];
    return Object.entries(data).map(([k, v]) => [k, typeof v === "object" ? JSON.stringify(v) : String(v)]);
  }, [data]);

  const columns = useMemo(() => {
    if (!isArrayOfObjects) return [];
    const keys = new Set();
    data.forEach(row => Object.keys(row).forEach(k => keys.add(k)));
    const preferred = ["Name", "Mobile", "Country", "CNIC", "Address"];
    const rest = [...keys].filter(k => !preferred.includes(k));
    return [...preferred.filter(k => keys.has(k)), ...rest];
  }, [data, isArrayOfObjects]);

  return (
    <>
      <Head>
        <title>SIM Information</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="page">
        <div className="card">
          <h1 className="title">Pakistan SIM Data</h1>
          <p className="subtitle">Enter a number in format <b>03xxxxxxxxx</b></p>

          <div className="form">
            <input
              className={`input ${!isValid && number ? "error" : ""}`}
              inputMode="numeric"
              maxLength={11}
              value={number}
              onChange={(e) => setNumber(e.target.value.replace(/[^0-9]/g, "").slice(0, 11))}
              placeholder="03xxxxxxxxx"
            />
            <button className="button" onClick={handleCheck} disabled={loading || !isValid}>
              {loading ? (<><span className="spinner" />Checking…</>) : "Check"}
            </button>
          </div>

          {/* Join Telegram button (main page only) */}
          <div style={{ textAlign: "center", marginTop: 10 }}>
            <a
              href={TELEGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="button join-btn"
              style={{ display: "inline-block", textDecoration: "none", background: "#229ED9" }}
            >
              Join Telegram
            </a>
          </div>

          {status && (
            <span className={`badge ${status === "success" ? "ok" : "bad"}`} style={{ display: "inline-block" }}>
              Status: {status}
            </span>
          )}

          {error && <div className="alert error">{error}</div>}

          {/* Array-of-objects -> pretty table */}
          {isArrayOfObjects && (
            <div className="tableWrap">
              <div className="tableScroll">
                <table className="table">
                  <thead>
                    <tr>
                      {columns.map((c) => <th key={c}>{c}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((row, idx) => (
                      <tr key={idx}>
                        {columns.map((c) => {
                          const val = row[c] ?? "";
                          const cls =
                            c === "Name"    ? "col-name"   :
                            c === "Mobile"  ? "col-mobile" :
                            c === "Country" ? "col-country":
                            c === "CNIC"    ? "col-cnic"   :
                            c === "Address" ? "col-addr wrap" : "";
                          const display = c === "Mobile" ? fmtMobile(val) : val;
                          return <td key={c} className={cls}>{String(display)}</td>;
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Single object / primitive -> key/value rows */}
          {!isArrayOfObjects && data && (
            <div className="tableWrap">
              <div className="tableScroll">
                <table className="table">
                  <thead><tr><th>Field</th><th>Value</th></tr></thead>
                  <tbody>
                    {kvRows.length > 0 ? kvRows.map(([k, v]) => (
                      <tr key={k}><td className="col-name"><strong>{k}</strong></td><td className="col-addr wrap">{v}</td></tr>
                    )) : (
                      <tr><td className="col-name"><strong>response</strong></td><td className="col-addr wrap">{String(data)}</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="footer">©️ 2025 SIM Information • Saeed Ahmed</div>
        </div>
      </div>
    </>
  );
}
