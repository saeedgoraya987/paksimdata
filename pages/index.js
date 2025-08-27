import { useMemo, useState } from "react";
import Head from "next/head";

export default function Home() {
  const [number, setNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [payload, setPayload] = useState(null);
  const [error, setError] = useState("");

  const isValid = useMemo(() => /^03\d{9}$/.test(number), [number]);

  async function handleCheck() {
    setError("");
    setPayload(null);

    if (!isValid) {
      setError("Please enter a valid number (e.g., 03xxxxxxxxx).");
      return;
    }

    setLoading(true);
    try {
      // Use your Vercel API route (proxy) or call upstream directly
      const res = await fetch(`/api/simdata?num=${encodeURIComponent(number)}`);
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || "Failed to fetch data");
      setPayload(json.data);
    } catch (e) {
      setError(e.message || "Request failed");
    } finally {
      setLoading(false);
    }
  }

  const rows = useMemo(() => {
    if (!payload) return [];
    if (typeof payload === "string") return [["response", payload]];
    if (Array.isArray(payload)) return payload.map((v, i) => [String(i), JSON.stringify(v)]);
    return Object.entries(payload).map(([k, v]) => [k, typeof v === "object" ? JSON.stringify(v) : String(v)]);
  }, [payload]);

  return (
    <>
      <Head>
        <title>SIM Data Checker</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="page">
        <div className="card">
          <h1 className="title">SIM Data Checker</h1>
          <p className="subtitle">Enter a number in format <b>03xxxxxxxxx</b></p>

          <div className="form">
            <input
              className={`input ${!isValid && number ? "error" : ""}`}
              inputMode="numeric"
              maxLength={11}
              value={number}
              onChange={(e) =>
                setNumber(e.target.value.replace(/[^0-9]/g, "").slice(0, 11))
              }
              placeholder="03xxxxxxxxx"
            />
            <button
              className="button"
              onClick={handleCheck}
              disabled={loading || !isValid}
            >
              {loading ? (<><span className="spinner" />Checking…</>) : "Check"}
            </button>
          </div>

          {error && <div className="alert error">{error}</div>}

          {rows.length > 0 && (
            <div className="tableWrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Field</th>
                    <th>Value</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(([k, v]) => (
                    <tr key={k}>
                      <td><strong>{k}</strong></td>
                      <td>{v}</td>
                    </tr>
                  ))}
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
