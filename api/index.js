export const config = { runtime: "edge" };

const TARGET = (process.env.TARGET_DOMAIN || "").replace(/\/+$/, "");

const HOP = new Set([
  "connection", "keep-alive", "transfer-encoding",
  "te", "trailer", "upgrade", "proxy-authorization", "proxy-authenticate"
]);

export default async function handler(req) {
  if (!TARGET) return new Response("TARGET_DOMAIN not set", { status: 500 });

  const slash = req.url.indexOf("/", 8);
  const path = slash === -1 ? "/" : req.url.slice(slash);
  const targetUrl = TARGET + path;

  const headers = new Headers();
  for (const [k, v] of req.headers.entries()) {
    const lk = k.toLowerCase();
    if (HOP.has(lk)) continue;
    if (lk.startsWith("x-vercel-")) continue;
    if (lk === "x-forwarded-host" || lk === "x-forwarded-proto" || lk === "x-forwarded-port") continue;
    headers.set(k, v);
  }
  const ip = req.headers.get("x-real-ip") || req.headers.get("x-forwarded-for");
  if (ip) headers.set("x-forwarded-for", ip);

  return fetch(targetUrl, {
    method: req.method,
    headers,
    body: req.body,
    redirect: "manual",
    duplex: "half"
  });
}
