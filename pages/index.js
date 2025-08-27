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
      // Use the serverless proxy we set up at /api/simdata
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

      <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-500 flex items-center justify-center p-4">
        <div className="bg-white w-full max-w-xl rounded-2xl shadow-xl p-6">
          <h1 className="text-3xl font-extrabold text-gray-900 text-center">SIM Data Checker</h1>
          <p className="text-center text-gray-600 mt-1">
            Enter a number in format <b>03xxxxxxxxx</b>
          </p>

          <div className="mt-6 flex gap-2">
            <input
              inputMode="numeric"
              pattern="^03\\d{9}$"
              maxLength={11}
              value={number}
              onChange={(e) => setNumber(e.target.value.replace(/[^0-9]/g, "").slice(0, 11))}
              placeholder="03xxxxxxxxx"
              className={`flex-1 p-3 rounded-xl border outline-none transition
                ${isValid ? "border-gray-300 focus:ring-2 focus:ring-purple-400"
                          : "border-red-300 focus:ring-2 focus:ring-red-300"}`}
            />
            <button
              onClick={handleCheck}
              disabled={loading || !isValid}
              className={`px-5 min-w-28 rounded-xl font-semibold text-white transition
                ${loading || !isValid ? "bg-purple-300 cursor-not-allowed" : "bg-purple-600 hover:bg-purple-700"}`}
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Checking…
                </span>
              ) : "Check"}
            </button>
          </div>

          {error && (
            <div className="mt-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
              {error}
            </div>
          )}

          {rows.length > 0 && (
            <div className="mt-6 border rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-purple-600 text-white">
                  <tr>
                    <th className="p-3 text-left">Field</th>
                    <th className="p-3 text-left">Value</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(([k, v]) => (
                    <tr key={k} className="border-t hover:bg-gray-50">
                      <td className="p-3 font-semibold text-gray-800">{k}</td>
                      <td className="p-3 text-gray-700 break-words">{v}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <footer className="mt-6 text-xs text-gray-500 text-center">
            Powered by your API • Deployed on Vercel
          </footer>
        </div>
      </div>
    </>
  );
}
