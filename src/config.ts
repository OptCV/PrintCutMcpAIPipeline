import { resolve } from "node:path";

export const ROOT = process.env.PRINTCUT_ROOT ?? String.raw`D:\PrintCut`;

export const PATHS = {
  inbox: resolve(ROOT, "inbox"),
  jobs: resolve(ROOT, "jobs"),
  output: resolve(ROOT, "output"),
  archive: resolve(ROOT, "archive"),
  error: resolve(ROOT, "error"),
  logs: resolve(ROOT, "logs")
};

export const MCP_CONFIG_PATH = resolve(
  process.env.MCP_CONFIG_PATH ?? "mcp-servers.json"
);

export const CLAUDE_BIN = process.env.CLAUDE_BIN ?? "claude";
export const DROP_SETTLE_MS = Number(process.env.DROP_SETTLE_MS ?? "4000");

export const DEFAULTS = {
  maxPdfWidthIn: 48,
  bleedIn: 0.125,
  itemGapIn: 0.5,
  registrationDiameterIn: 0.25,
  registrationOffsetIn: 0.25,
  extraMarksAfterIn: 48,
  extraMarkSpacingIn: 42,
  allowRotation: true
};

export const SUPPORTED_EXTENSIONS = new Set([
  ".pdf",".png",".jpg",".jpeg",".tif",".tiff",".bmp",".gif",
  ".webp",".svg",".svgz",".ai",".eps"
]);
