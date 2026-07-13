import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const manifest = JSON.parse(await readFile(resolve(root, "manifest.json"), "utf8"));
const requiredVariables = [
  "--color-bg",
  "--color-bg-elevated",
  "--color-bg-sidebar",
  "--color-fg",
  "--color-fg-muted",
  "--color-border",
  "--color-accent",
  "--color-accent-hover",
  "--color-danger",
  "--color-warning",
  "--color-terminal-bg",
  "--color-terminal-fg",
];

if (manifest.schemaVersion !== 1 || !Array.isArray(manifest.themes)) {
  throw new Error("manifest.json must use schemaVersion 1 and contain themes[]");
}

const ids = new Set();
for (const theme of manifest.themes) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(theme.id)) {
    throw new Error(`Invalid theme id: ${theme.id}`);
  }
  if (ids.has(theme.id)) throw new Error(`Duplicate theme id: ${theme.id}`);
  ids.add(theme.id);
  if (theme.file !== `themes/${theme.id}.css`) {
    throw new Error(`Theme ${theme.id} must use themes/${theme.id}.css`);
  }
  if (!Number.isSafeInteger(theme.version) || theme.version < 1) {
    throw new Error(`Theme ${theme.id} must have a positive integer version`);
  }
  if (theme.mode !== "dark" && theme.mode !== "light") {
    throw new Error(`Theme ${theme.id} must use dark or light mode`);
  }

  const path = resolve(root, theme.file);
  const info = await stat(path);
  if (!info.isFile()) throw new Error(`${theme.file} is not a file`);
  const css = await readFile(path, "utf8");
  if (!css.includes(`data-acorn-theme="${theme.id}"`)) {
    throw new Error(`${theme.file} does not target ${theme.id}`);
  }
  const missing = requiredVariables.filter(
    (variable) => !new RegExp(`${variable}\\s*:\\s*[^;\\n]+`).test(css),
  );
  if (missing.length > 0) {
    throw new Error(`${theme.file} is missing ${missing.join(", ")}`);
  }
}

console.log(`Validated ${manifest.themes.length} Acorn themes.`);
