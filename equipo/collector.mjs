// Recolector de candidatas para el agente de noticias. Node 18+, sin dependencias.
// Uso: node collector.mjs [horas] [area]   (por defecto 168 = 7 días; area = google|ia|cro|privacidad|futuro|expertos, opcional)
// Cada fuente lleva su área: el jefe del equipo reparte las secciones entre sus trabajadores.
const HOURS = Number(process.argv[2] || 168);
const AREA = process.argv[3] || "";
const NOW = Date.now();
const SINCE = NOW - HOURS * 3600e3;
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0 Safari/537.36";

const STRICT = /GA4|google analytics|tag ?manager|\bGTM\b|datalayer|data layer|server-side|consent|cookie|privacy|GDPR|tracking|pixel|attribution|bigquery|looker|\bMCP\b|shopify|web analytics/i;
const TOPIC = /analytic|GA4|google tag|tag manager|\bGTM\b|bigquery|looker|measur|attribution|consent|cookie|privacy|GDPR|tracking|pixel|conversion|\bads?\b|advertis|agent|\bMCP\b|shopify|checkout|commerce|data scien|machine learning|\bML\b|analyst|hiring|jobs?\b|skills?|salar|layoff|labor|labour|workforce|AI Mode|ChatGPT|Gemini/i;

// type: rss | sitemap | gnotes | github ; filter: true = solo títulos que encajen con TOPIC
const SOURCES = [
  // Oficiales
  { name: "GA4 notas de versión", area: "google", type: "gnotes", url: "https://support.google.com/analytics/answer/9164320?hl=en" },
  { name: "GTM notas de versión", area: "google", type: "gnotes", url: "https://support.google.com/tagmanager/answer/4620708?hl=en" },
  { name: "Looker Studio notas", area: "google", type: "gnotes", url: "https://support.google.com/looker-studio/answer/11521624?hl=en" },
  { name: "Firebase releases", area: "google", type: "gnotes", url: "https://firebase.google.com/support/releases", max: 2, note: "solo importa si toca Analytics o el SDK de medición" },
  { name: "BigQuery release notes", area: "google", type: "rss", url: "https://docs.cloud.google.com/feeds/bigquery-release-notes.xml", max: 4 },
  { name: "Shopify changelog", area: "google", type: "rss", url: "https://shopify.dev/changelog/feed.xml" },
  { name: "Google Ads & Commerce", area: "google", type: "rss", url: "https://blog.google/products/ads-commerce/rss/" },
  { name: "Google Analytics blog", area: "google", type: "rss", url: "https://blog.google/products/marketingplatform/analytics/rss/" },
  { name: "Google Ads Developer", area: "google", type: "rss", url: "https://ads-developers.googleblog.com/feeds/posts/default", filter: true },
  { name: "Google Developers", area: "google", type: "rss", url: "https://developers.googleblog.com/feeds/posts/default", filter: true },
  { name: "GA MCP oficial (GitHub)", area: "ia", type: "rss", url: "https://github.com/googleanalytics/google-analytics-mcp/releases.atom" },
  // Expertos
  { name: "Analytics Mania", area: "expertos", type: "sitemap", url: "https://www.analyticsmania.com/post-sitemap.xml", path: "/post/", max: 3, note: "fecha = última modificación; puede ser un post antiguo actualizado" },
  { name: "Simo Ahava", area: "expertos", type: "rss", url: "https://www.simoahava.com/index.xml" },
  { name: "Stape", area: "expertos", type: "rss", url: "https://stape.io/rss.xml" },
  { name: "GA4BigQuery", area: "expertos", type: "rss", url: "https://www.ga4bigquery.com/rss/" },
  { name: "Loves Data", area: "expertos", type: "sitemap", url: "https://www.lovesdata.com/sitemap.xml", path: "/blog/", note: "fecha = última modificación" },
  { name: "IKAUE", area: "expertos", type: "rss", url: "https://ikaue.com/feed" },
  { name: "Lukas Oldenburg", area: "expertos", type: "rss", url: "https://lukas-oldenburg.medium.com/feed" },
  { name: "Quantable", area: "expertos", type: "rss", url: "https://www.quantable.com/feed/" },
  { name: "Analytics Power Hour", area: "expertos", type: "rss", url: "https://analyticshour.io/feed/podcast/" },
  { name: "Product Hackers", area: "cro", type: "rss", url: "https://producthackers.com/es/blog/feed/" },
  // Noticias rápidas EE. UU.
  { name: "Search Engine Roundtable", area: "google", type: "rss", url: "https://www.seroundtable.com/index.rdf", filter: true },
  { name: "PPC Land", area: "google", type: "rss", url: "https://ppc.land/rss/", filter: true, max: 12 },
  { name: "MarTech", area: "cro", type: "rss", url: "https://martech.org/feed/", filter: true },
  { name: "Digiday", area: "ia", type: "rss", url: "https://digiday.com/feed/", filter: true },
  { name: "TechCrunch IA", area: "ia", type: "rss", url: "https://techcrunch.com/category/artificial-intelligence/feed/", filter: true },
  { name: "The Verge", area: "ia", type: "rss", url: "https://www.theverge.com/rss/index.xml", filter: true },
  // Plataformas
  { name: "OpenAI", area: "ia", type: "rss", url: "https://openai.com/news/rss.xml", max: 10 },
  { name: "Anthropic", area: "ia", type: "sitemap", url: "https://www.anthropic.com/sitemap.xml", path: "/news/", max: 4, note: "fecha = última modificación" },
  { name: "Meta newsroom", area: "ia", type: "rss", url: "https://about.fb.com/feed/", filter: true },
  { name: "Microsoft Ads", area: "google", type: "rss", url: "https://about.ads.microsoft.com/en/blog/rss" },
  // Habilidades y empleo
  { name: "Indeed Hiring Lab", area: "futuro", type: "rss", url: "https://hiringlab.indeed.com/feed/" },
  { name: "KDnuggets", area: "futuro", type: "rss", url: "https://www.kdnuggets.com/feed", filter: true },
  { name: "Towards Data Science", area: "futuro", type: "rss", url: "https://towardsdatascience.com/feed/", filter: true },
  { name: "The Batch", area: "ia", type: "rss", url: "https://charonhub.deeplearning.ai/rss/" },
  // Growth y CRO
  { name: "CXL", area: "cro", type: "rss", url: "https://cxl.com/blog/feed/" },
  { name: "VWO", area: "cro", type: "rss", url: "https://vwo.com/blog/feed/" },
  { name: "GrowthBook releases", area: "cro", type: "rss", url: "https://github.com/growthbook/growthbook/releases.atom", max: 3 },
  // Privacidad
  { name: "noyb", area: "privacidad", type: "rss", url: "https://noyb.eu/en/rss" },
  { name: "IAB Europe", area: "privacidad", type: "rss", url: "https://iabeurope.eu/feed/" },
  // Comunidad
  { name: "Hacker News", area: "expertos", type: "rss", url: "https://hnrss.org/newest?q=analytics&points=20", strict: true },
  { name: "Hacker News (tracking/consent)", area: "privacidad", type: "rss", url: "https://hnrss.org/newest?q=tracking&points=30", strict: true },
  // Radar de agentes que publica la gente
  { name: "GitHub radar", area: "expertos", type: "github", queries: ["ga4 mcp", "google analytics mcp", "tag manager mcp", "ga4 agent", "tracking audit agent", "analytics agent bigquery"] },
];

const decode = s => s
  .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
  .replace(/<[^>]+>/g, "")
  .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"')
  .replace(/&#0?39;|&apos;|&#8217;|&rsquo;/g, "'").replace(/&#8220;|&#8221;|&ldquo;|&rdquo;/g, '"')
  .replace(/&#8211;|&#8212;|&ndash;|&mdash;/g, "-").replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(n)).replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
  .replace(/\s+/g, " ").trim();
const tag = (block, names) => {
  for (const n of names) {
    const m = block.match(new RegExp(`<${n}(?:\\s[^>]*)?>([\\s\\S]*?)</${n}>`, "i"));
    if (m) return decode(m[1]);
  }
  return "";
};
const link = block => {
  const href = block.match(/<link[^>]*rel=["']alternate["'][^>]*href=["']([^"']+)["']/i) || block.match(/<link[^>]*href=["']([^"']+)["'][^>]*\/?>/i);
  if (href) return href[1];
  return tag(block, ["link", "guid", "id"]);
};

async function get(url, accept = "*/*") {
  const r = await fetch(url, { headers: { "User-Agent": UA, Accept: accept }, signal: AbortSignal.timeout(20000), redirect: "follow" });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.text();
}

async function rss(s) {
  const xml = await get(s.url, "application/rss+xml, application/atom+xml, application/xml, text/xml");
  const blocks = xml.match(/<item[\s>][\s\S]*?<\/item>|<entry[\s>][\s\S]*?<\/entry>/gi) || [];
  const out = [];
  for (const b of blocks) {
    const d = new Date(tag(b, ["pubDate", "published", "dc:date", "updated"]));
    if (isNaN(d) || d < SINCE || d > NOW + 864e5) continue;
    const title = tag(b, ["title"]);
    if (s.filter && !TOPIC.test(title + " " + tag(b, ["category"]))) continue;
    if (s.strict && !STRICT.test(title)) continue;
    out.push({ d, title, url: link(b) });
  }
  return out;
}

async function sitemap(s) {
  const xml = await get(s.url, "application/xml");
  const out = [];
  for (const m of xml.matchAll(/<url>([\s\S]*?)<\/url>/g)) {
    const loc = tag(m[1], ["loc"]);
    const d = new Date(tag(m[1], ["lastmod"]));
    if (!loc.includes(s.path) || isNaN(d) || d < SINCE) continue;
    const slug = loc.replace(/\/$/, "").split("/").pop().replace(/-/g, " ");
    out.push({ d, title: slug, url: loc });
  }
  return out;
}

const MONTHS = "January|February|March|April|May|June|July|August|September|October|November|December";
async function gnotes(s) {
  const html = await get(s.url, "text/html");
  const seen = new Set();
  const out = [];
  for (const m of html.matchAll(new RegExp(`(${MONTHS}) (\\d{1,2}), (20\\d\\d)`, "g"))) {
    const d = new Date(`${m[1]} ${m[2]}, ${m[3]} 12:00 UTC`);
    const key = d.toISOString().slice(0, 10);
    if (seen.has(key) || d < SINCE || d > NOW + 864e5) continue;
    seen.add(key);
    out.push({ d, title: `entrada del ${key} (ábrela con WebFetch para ver el contenido)`, url: s.url });
  }
  if (!out.length) {
    const all = [...html.matchAll(new RegExp(`(${MONTHS}) (\\d{1,2}), (20\\d\\d)`, "g"))]
      .map(m => new Date(`${m[1]} ${m[2]}, ${m[3]} 12:00 UTC`)).filter(d => d <= NOW).sort((a, b) => b - a);
    if (all[0]) return { empty: `sin entradas nuevas (la última es del ${all[0].toISOString().slice(0, 10)})` };
  }
  return out;
}

async function github(s) {
  const since = new Date(SINCE).toISOString().slice(0, 10);
  const map = new Map();
  for (const q of s.queries) {
    const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(`${q} created:>${since}`)}&sort=stars&order=desc&per_page=5`;
    const j = JSON.parse(await get(url, "application/vnd.github+json"));
    for (const it of j.items || []) {
      const text = `${it.full_name} ${it.description || ""}`;
      if (!STRICT.test(text) || /go-to-market|\bsales\b|prospect|battlecard|search console|\bSEO\b|cost tracking|banking/i.test(text)) continue;
      map.set(it.full_name, { d: new Date(it.created_at), title: `★${it.stargazers_count} ${it.full_name}: ${(it.description || "").slice(0, 120)}`, url: it.html_url, stars: it.stargazers_count });
    }
    await new Promise(r => setTimeout(r, 1200));
  }
  return [...map.values()].sort((a, b) => b.stars - a.stars).slice(0, 8);
}

const run = { rss, sitemap, gnotes, github };
const clean = u => {
  try {
    const x = new URL(decodeURI(u.trim()));
    for (const k of [...x.searchParams.keys()]) if (/^utm_/.test(k)) x.searchParams.delete(k);
    return x.toString();
  } catch { return u.trim(); }
};
const age = d => `${Math.max(0, Math.round((NOW - d) / 3600e3))}h`;

const lines = [`# Candidatas de las últimas ${HOURS} h (generado ${new Date(NOW).toISOString()})`, `# Formato: [antigüedad] título · url`];
const failed = [];
for (const s of SOURCES) {
  if (AREA && s.area !== AREA) continue;
  try {
    const res = await run[s.type](s);
    if (res && res.empty) { lines.push(`\n## [${s.area}] ${s.name}: ${res.empty}`); continue; }
    const items = res.sort((a, b) => b.d - a.d).slice(0, s.max || 8);
    if (!items.length) continue;
    lines.push(`\n## [${s.area}] ${s.name}${s.note ? ` (${s.note})` : ""}`);
    for (const it of items) lines.push(`- [${age(it.d)}] ${it.title.slice(0, 160)} · ${clean(it.url)}`);
  } catch (e) {
    failed.push(`${s.name} (${e.message})`);
  }
}
if (failed.length) lines.push(`\n## Fuentes que fallaron hoy (búscalas con WebSearch si importan): ${failed.join("; ")}`);
lines.push(`\n## Sin feed (búscalas con WebSearch/WebFetch): Search Engine Land, Optimize Smart, AEPD, Perplexity, Amazon Ads, Reddit, informes de empleo de España`);
console.log(lines.join("\n"));
