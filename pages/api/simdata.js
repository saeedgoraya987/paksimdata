export const config = { runtime: "edge" };

const ORIGIN = "https://famofcfallxd.serv00.net/apis/simdata2.php";

export default async function handler(req) {
  try {
    const { searchParams } = new URL(req.url);
    const num = (searchParams.get("num") || "").trim();

    if (!/^03\d{9}$/.test(num)) {
      return new Response(JSON.stringify({ ok: false, error: "Invalid number. Use 03xxxxxxxxx." }), {
        status: 400,
        headers: { "content-type": "application/json" }
      });
    }

    const upstream = `${ORIGIN}?num=${encodeURIComponent(num)}`;
    const resp = await fetch(upstream, { headers: { accept: "application/json" } });
    const text = await resp.text(); // sometimes upstream sends text with warnings

    // Try to parse to object
    let raw;
    try {
      raw = JSON.parse(text);
    } catch {
      // If the upstream returned PHP warnings + JSON, try to find the last {...}
      const match = text.match(/\{[\s\S]*\}$/);
      raw = match ? JSON.parse(match[0]) : { status: "unknown", data: text };
    }

    // Remove noisy "message" field
    if (raw && typeof raw === "object") {
      delete raw.message;
    }

    // Normalize raw.data: if it’s a JSON string, parse it
    let normalizedData = raw?.data;
    if (typeof normalizedData === "string") {
      try {
        normalizedData = JSON.parse(normalizedData);
      } catch {
        // keep as string if it isn't valid JSON
      }
    }

    return new Response(
      JSON.stringify({ ok: true, status: raw?.status ?? null, data: normalizedData }),
      { status: 200, headers: { "content-type": "application/json" } }
    );
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: e?.message || "Unknown error" }), {
      status: 500,
      headers: { "content-type": "application/json" }
    });
  }
}
