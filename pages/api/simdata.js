export const config = { runtime: "edge" }; // fast on Vercel

const ORIGIN = "https://famofcfallxd.serv00.net/apis/simdata2.php";

export default async function handler(req) {
  try {
    const { searchParams } = new URL(req.url);
    const num = (searchParams.get("num") || "").trim();

    // Validate PK number pattern: 03xxxxxxxxx (11 digits total)
    if (!/^03\d{9}$/.test(num)) {
      return new Response(JSON.stringify({ ok: false, error: "Invalid number. Use 03xxxxxxxxx." }), {
        status: 400,
        headers: { "content-type": "application/json" }
      });
    }

    const upstream = `${ORIGIN}?num=${encodeURIComponent(num)}`;
    const resp = await fetch(upstream, { headers: { "accept": "application/json" } });
    if (!resp.ok) {
      return new Response(JSON.stringify({ ok: false, error: "Upstream request failed" }), {
        status: 502,
        headers: { "content-type": "application/json" }
      });
    }

    // Try to parse JSON; if not JSON, return text
    const text = await resp.text();
    try {
      const data = JSON.parse(text);
      return new Response(JSON.stringify({ ok: true, data }), {
        status: 200,
        headers: { "content-type": "application/json" }
      });
    } catch {
      return new Response(JSON.stringify({ ok: true, data: text }), {
        status: 200,
        headers: { "content-type": "application/json" }
      });
    }
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: e?.message || "Unknown error" }), {
      status: 500,
      headers: { "content-type": "application/json" }
    });
  }
}
