const fs = require("fs");
const path = require("path");

const targetPath = path.join(__dirname, "..", "google-services.json");

const base64 = process.env.GOOGLE_SERVICES_JSON_BASE64;
const rawJson = process.env.GOOGLE_SERVICES_JSON;

const stripBom = (value) => value.replace(/^\uFEFF/, "");

const tryParseJson = (value) => {
  try {
    JSON.parse(stripBom(value));
    return true;
  } catch {
    return false;
  }
};

const looksLikeBase64 = (value) =>
  /^[A-Za-z0-9+/=\r\n]+$/.test(value.trim()) && value.trim().length % 4 === 0;

const decodeBase64 = (value) => Buffer.from(value.trim(), "base64").toString("utf8");

const writeFile = (contents, sourceLabel) => {
  const normalized = stripBom(contents).trim();
  if (!tryParseJson(normalized)) {
    throw new Error(
      `${sourceLabel} did not produce valid JSON. ` +
        "Provide raw JSON in GOOGLE_SERVICES_JSON or base64 JSON in GOOGLE_SERVICES_JSON_BASE64."
    );
  }
  fs.writeFileSync(targetPath, normalized, "utf8");
  console.log("Wrote google-services.json for Android build.");
};

if (fs.existsSync(targetPath)) {
  const existing = fs.readFileSync(targetPath, "utf8");
  if (tryParseJson(existing)) {
    console.log("google-services.json already exists and is valid. Skipping creation.");
    process.exit(0);
  }

  if (looksLikeBase64(existing)) {
    try {
      writeFile(decodeBase64(existing), "existing google-services.json (base64)");
      console.log("Fixed malformed google-services.json by decoding base64 content.");
      process.exit(0);
    } catch {
      // Fall through to error below.
    }
  }

  const badFileMessage =
    "google-services.json exists but is malformed. " +
    "Delete it and set GOOGLE_SERVICES_JSON_BASE64 (recommended) or GOOGLE_SERVICES_JSON.";
  console.error(badFileMessage);
  process.exit(1);
}

const candidates = [];

if (rawJson && rawJson.trim().length > 0) {
  candidates.push({ source: "GOOGLE_SERVICES_JSON", value: rawJson });
  if (looksLikeBase64(rawJson)) {
    candidates.push({
      source: "GOOGLE_SERVICES_JSON (base64 fallback)",
      value: decodeBase64(rawJson),
    });
  }
}

if (base64 && base64.trim().length > 0) {
  candidates.push({
    source: "GOOGLE_SERVICES_JSON_BASE64",
    value: decodeBase64(base64),
  });
  if (base64.trim().startsWith("{")) {
    candidates.push({
      source: "GOOGLE_SERVICES_JSON_BASE64 (raw JSON fallback)",
      value: base64,
    });
  }
}

for (const candidate of candidates) {
  if (tryParseJson(candidate.value)) {
    writeFile(candidate.value, candidate.source);
    process.exit(0);
  }
}

const isCi = Boolean(process.env.EAS_BUILD || process.env.CI);
const message =
  "google-services.json is missing or invalid and no valid env var was provided. " +
  "Set GOOGLE_SERVICES_JSON_BASE64 (recommended, base64-encoded JSON) or GOOGLE_SERVICES_JSON (raw JSON).";

if (isCi) {
  console.error(message);
  process.exit(1);
}

console.warn(message);
