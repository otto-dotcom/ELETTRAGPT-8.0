/**
 * fetch-sample-emails.js
 *
 * Connects to seveso@tempocasa.it via IMAP, downloads the last N emails,
 * strips them to plain text and saves each one as a .txt file in ./sample-emails/
 * Also prints a compact summary so you can see patterns at a glance.
 *
 * Usage:
 *   cp .env.example .env          # fill in your real credentials
 *   npm install
 *   node fetch-sample-emails.js
 */

require("dotenv").config();
const imaps = require("imap-simple");
const { simpleParser } = require("mailparser");
const fs = require("fs");
const path = require("path");

// ── config ──────────────────────────────────────────────────────────────────
const FETCH_LAST_N = 80;           // how many emails to pull (most recent first)
const OUTPUT_DIR = path.join(__dirname, "sample-emails");
const KEYWORDS = [                 // only keep emails that look like apartment requests
  "richiesta", "immobiliare", "idealista", "casa.it", "appartamento",
  "bilocale", "trilocale", "chiamata", "annuncio", "richiede", "locazione",
  "vendita", "affitto", "contatto", "inquiry"
];
// ────────────────────────────────────────────────────────────────────────────

const imapConfig = {
  imap: {
    user: process.env.IMAP_USER,
    password: process.env.IMAP_PASSWORD,
    host: process.env.IMAP_HOST,
    port: parseInt(process.env.IMAP_PORT || "993"),
    tls: process.env.IMAP_TLS !== "false",
    tlsOptions: { rejectUnauthorized: false },
    authTimeout: 10000,
  },
};

// ── helpers ──────────────────────────────────────────────────────────────────

/** Strip HTML to readable plain text */
function stripHtml(html) {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<\/div>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s{3,}/g, "\n\n")
    .trim();
}

/** Detect which portal sent the email */
function detectPortal(from, subject, body) {
  const haystack = `${from} ${subject} ${body}`.toLowerCase();
  if (haystack.includes("immobiliare")) return "immobiliare";
  if (haystack.includes("idealista"))   return "idealista";
  if (haystack.includes("casa.it"))     return "casa";
  return "altro";
}

/** Detect if this is a missed-call notification */
function detectType(subject, body) {
  const haystack = `${subject} ${body}`.toLowerCase();
  if (
    haystack.includes("chiamata persa") ||
    haystack.includes("missed call") ||
    haystack.includes("ha cercato di contattarvi") ||
    haystack.includes("numero dedicato")
  ) return "chiamata_persa";
  return "richiesta";
}

/** True if the email looks like an apartment-request email */
function isRelevant(subject, body) {
  const haystack = `${subject} ${body}`.toLowerCase();
  return KEYWORDS.some((k) => haystack.includes(k));
}

// ── main ─────────────────────────────────────────────────────────────────────

async function run() {
  if (!process.env.IMAP_USER || !process.env.IMAP_PASSWORD) {
    console.error("ERROR: Set IMAP_USER and IMAP_PASSWORD in your .env file first.");
    process.exit(1);
  }

  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  console.log(`Connecting to ${process.env.IMAP_HOST} as ${process.env.IMAP_USER}...`);
  const connection = await imaps.connect(imapConfig);

  await connection.openBox("INBOX");
  console.log("Connected. Searching for recent emails...\n");

  const searchCriteria = ["ALL"];
  const fetchOptions = {
    bodies: ["HEADER", "TEXT", ""],
    markSeen: false,
    struct: true,
  };

  const messages = await connection.search(searchCriteria, fetchOptions);
  const recent = messages.slice(-FETCH_LAST_N);

  console.log(`Found ${messages.length} total emails — processing last ${recent.length}\n`);

  const summary = [];
  let saved = 0;

  for (const msg of recent) {
    const raw = msg.parts.find((p) => p.which === "")?.body;
    if (!raw) continue;

    let parsed;
    try {
      parsed = await simpleParser(raw);
    } catch {
      continue;
    }

    const from    = parsed.from?.text || "";
    const subject = parsed.subject || "(no subject)";
    const date    = parsed.date ? parsed.date.toISOString() : "";
    const body    = parsed.text || (parsed.html ? stripHtml(parsed.html) : "");

    if (!isRelevant(subject, body)) continue;

    const portal = detectPortal(from, subject, body);
    const type   = detectType(subject, body);

    // Build a clean text dump for studying patterns
    const content = [
      `PORTAL  : ${portal}`,
      `TYPE    : ${type}`,
      `DATE    : ${date}`,
      `FROM    : ${from}`,
      `SUBJECT : ${subject}`,
      "─".repeat(60),
      body.slice(0, 2000),   // cap at 2 000 chars for readability
    ].join("\n");

    // File name: YYYY-MM-DD_portal_type_nnn.txt
    const dateStr = date.slice(0, 10);
    const fname   = `${dateStr}_${portal}_${type}_${String(saved + 1).padStart(3, "0")}.txt`;
    fs.writeFileSync(path.join(OUTPUT_DIR, fname), content, "utf8");

    summary.push({ fname, portal, type, from, subject });
    saved++;
  }

  connection.end();

  // ── print summary table ──────────────────────────────────────────────────
  console.log(`\n${"═".repeat(80)}`);
  console.log(`SAVED ${saved} RELEVANT EMAILS  →  ${OUTPUT_DIR}`);
  console.log(`${"═".repeat(80)}\n`);

  console.log(
    "FILE".padEnd(50) +
    "PORTAL".padEnd(14) +
    "TYPE"
  );
  console.log("─".repeat(80));
  summary.forEach(({ fname, portal, type }) => {
    console.log(fname.padEnd(50) + portal.padEnd(14) + type);
  });

  // ── portal breakdown ──────────────────────────────────────────────────────
  console.log(`\n${"─".repeat(40)}`);
  console.log("PORTAL BREAKDOWN:");
  const portals = {};
  summary.forEach(({ portal }) => {
    portals[portal] = (portals[portal] || 0) + 1;
  });
  Object.entries(portals)
    .sort((a, b) => b[1] - a[1])
    .forEach(([p, n]) => console.log(`  ${p.padEnd(15)} ${n}`));

  console.log(`\nDone. Review files in ./sample-emails/ then adjust the n8n workflow prompt.`);
}

run().catch((err) => {
  console.error("IMAP error:", err.message);
  process.exit(1);
});
