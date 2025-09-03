export const config = { runtime: "edge" };

const ORIGIN = "https://www.simdetail.pro/";

export default async function handler(req) {
  try {
    const { searchParams } = new URL(req.url);
    const number = (searchParams.get("num") || "").trim();

    if (!/^03\d{9}$/.test(number)) {
      return new Response(JSON.stringify({
        status: "error",
        message: "Invalid number. Use 03xxxxxxxxx."
      }), {
        status: 400,
        headers: { "content-type": "application/json" }
      });
    }

    // Send POST request like PHP cURL
    const resp = await fetch(ORIGIN, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ number })
    });

    let text = await resp.text();

    // Strip HTML tags & decode entities
    const clean = text
      .replace(/<[^>]*>/g, " ")
      .replace(/&nbsp;/gi, " ")
      .replace(/\s+/g, " ")
      .trim();

    // If "No records found"
    if (/No records found/i.test(clean)) {
      return new Response(JSON.stringify({
        status: "not_found",
        query: number,
        message: "No records found. Please check the number."
      }, null, 2), {
        status: 200,
        headers: { "content-type": "application/json" }
      });
    }

    // Split into lines
    const lines = text
      .replace(/<br\s*\/?>/gi, "\n") // convert <br> into newlines
      .replace(/<\/p>|<\/div>/gi, "\n")
      .replace(/<[^>]*>/g, "")
      .split(/\r?\n/);

    let name = null;
    let cnic = null;
    let address = null;
    let numbers = [];

    let collectNumbers = false;
    let lastLabel = null;

    for (let line of lines) {
      line = line.trim();
      if (!line) continue;

      const lower = line.toLowerCase().replace(/:/g, "");

      if (lower === "name") {
        lastLabel = "name";
        continue;
      } else if (lower === "cnic") {
        lastLabel = "cnic";
        continue;
      } else if (lower === "address") {
        lastLabel = "address";
        continue;
      } else if (/^associated numbers/i.test(line)) {
        collectNumbers = true;
        lastLabel = null;
        continue;
      }

      if (lastLabel === "name") {
        name = line;
        lastLabel = null;
      } else if (lastLabel === "cnic") {
        cnic = line;
        lastLabel = null;
      } else if (lastLabel === "address") {
        address = line;
        lastLabel = null;
      } else if (collectNumbers) {
        if (/^\d+$/.test(line)) {
          numbers.push(line);
        }
      }
    }

    // Return JSON
    return new Response(JSON.stringify({
      status: "success",
      query: number,
      name,
      cnic,
      address,
      associated_numbers: numbers
    }, null, 2), {
      status: 200,
      headers: { "content-type": "application/json" }
    });

  } catch (e) {
    return new Response(JSON.stringify({
      status: "error",
      message: e?.message || "Unknown error"
    }, null, 2), {
      status: 500,
      headers: { "content-type": "application/json" }
    });
  }
}
