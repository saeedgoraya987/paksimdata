import { useMemo, useState } from "react";
import Head from "next/head";

export default function Home() {
  const [number, setNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  const isValid = useMemo(() => /^03\d{9}$/.test(number), [number]);

  async function handleCheck() {
    setError("");
    setData(null);
    setStatus(null);

    if (!isValid) {
      setError("Please enter a valid number (e.g., 03xxxxxxxxx).");
      return;
    }

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

  // shape helpers
  const isArrayOfObjects = Array.isArray(data) && data.every((r) => r && typeof r === "object");
  const kvRows = useMemo(() => {
    if (!data || Array.isArray(data)) return [];
    return Object.entries(data).map(([k, v]) => [k, typeof v === "object" ? JSON.stringify(v) : String(v)]);
  }, [data]);

  // build table columns for array-of-objects
  const columns = useMemo(() => {
    if (!isArrayOfObjects) return [];
    const keys = new Set();
    data.forEach((row) => Object.keys(row).forEach((k) => keys.add(k)));
    // Prefer a friendly order if present
    const preferred = ["Name", "Mobile", "Country", "CNIC", "Address"];
    const rest = [...keys].filter((k) => !preferred.includes(k));
    return [...preferred.filter((k) => keys.has(k)), ...rest];
  }, [data, isArrayOfObjects]);

  return (
    <>
      <Head>
        <title>SIM Data Checker</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="page">
        <div className="card">
          <h1 className="title">SIM Data Checker</h1>
          <p className="subtitle">
            Enter a number in format <b>03xxxxxxxxx</b>
          </p>

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

          {status && (
            <div style={{ marginTop: 12 }}>
              <span
                style={{
                  display: "inline-block",
                  padding: "6px 10px",
                  borderRadius: 999,
                  fontSize: 12,
                  fontWeight: 700,
                  color: status === "success" ? "#065f46" : "#7c2d12",
                  background: status === "success" ? "#d1fae5" : "#ffedd5",
                  border: `1px solid ${status === "success" ? "#a7f3d0" : "#fed7aa"}`
                }}
              >
                Status: {status}
              </span>
            </div>
          )}

          {error && <div className="alert error">{error}</div>}

          {/* Render array-of-objects as a proper table */}
          {isArrayOfObjects && (
            <div className="tableWrap">
              <table className="table">
                <thead>
                  <tr>
                    {columns.map((c) => (
                      <th key={c}>{c}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.map((row, idx) => (
                    <tr key={idx}>
                      {columns.map((c) => (
                        <td key={c}>{row[c] ?? ""}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Render single object / primitive as key-value rows */}
          {!isArrayOfObjects && data && (
            <div className="tableWrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Field</th>
                    <th>Value</th>
                  </tr>
                </thead>
                <tbody>
                  {kvRows.length > 0 ? (
                    kvRows.map(([k, v]) => (
                      <tr key={k}>
                        <td><strong>{k}</strong></td>
                        <td>{v}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td><strong>response</strong></td>
                      <td>{String(data)}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          <div className="footer">Powered by your API • Deployed on Vercel</div>
        </div>
      </div>
    </>
  );
}
