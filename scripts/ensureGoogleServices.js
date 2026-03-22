const fs = require("fs");
const path = require("path");

const targetPath = path.join(__dirname, "..", "google-services.json");

const base64 = process.env.GOOGLE_SERVICES_JSON_BASE64;
const rawJson = process.env.GOOGLE_SERVICES_JSON;

const writeFile = (contents) => {
  fs.writeFileSync(targetPath, contents, "utf8");
  console.log("Wrote google-services.json for Android build.");
};

if (fs.existsSync(targetPath)) {
  console.log("google-services.json already exists. Skipping creation.");
  process.exit(0);
}

if (rawJson && rawJson.trim().startsWith("{")) {
  writeFile(rawJson.trim());
  process.exit(0);
}

if (base64 && base64.trim().length > 0) {
  const decoded = Buffer.from(base64.trim(), "base64").toString("utf8");
  writeFile(decoded);
  process.exit(0);
}

const isCi = Boolean(process.env.EAS_BUILD || process.env.CI);
const message =
  "google-services.json is missing and no env var was provided. " +
  "Set GOOGLE_SERVICES_JSON_BASE64 (recommended) or GOOGLE_SERVICES_JSON.";

if (isCi) {
  console.error(message);
  process.exit(1);
}

console.warn(message);
