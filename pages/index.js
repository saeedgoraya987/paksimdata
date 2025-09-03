import { useMemo, useState } from "react";
import Head from "next/head";

const TELEGRAM_URL = "https://t.me/Saeed2578"; // <- put your link

function fmtMobile(s) {
  const str = String(s || "");
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
    setError(""); 
    setStatus(null); 
    setData(null);

    if (!isValid) {
      setError("Please enter a valid number (e.g., 03xxxxxxxxx).");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/simdata?num=${encodeURIComponent(number)}`);
      const json = await res.json();

      if (!json || json.status === "error") {
        throw new Error(json.message || "Failed to fetch data");
      }

      setStatus(json.status);
      setData(json);
    } catch (e) {
      setError(e.message || "Request failed");
    } finally {
      setLoading(false);
    }
  }

  // For single object -> show as key/value table
  const kvRows = useMemo(() => {
    if (!data || typeof data !== "object") return [];
    const exclude = ["status", "query"];
    return Object.entries(data)
      .filter(([k]) => !exclude.includes(k))
      .map(([k, v]) => [
        k,
        Array.isArray(v) ? v.join(", ") : (v ?? "")
      ]);
  }, [data]);

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

          {/* Join Telegram button */}
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

          {/* Show result as table */}
          {kvRows.length > 0 && (
            <div className="tableWrap">
              <div className="tableScroll">
                <table className="table">
                  <thead><tr><th>Field</th><th>Value</th></tr></thead>
                  <tbody>
                    {kvRows.map(([k, v]) => (
                      <tr key={k}>
                        <td className="col-name"><strong>{k}</strong></td>
                        <td className="col-addr wrap">{String(v)}</td>
                      </tr>
                    ))}
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
