import { access } from "node:fs/promises";
import type { JobManifest } from "./types";

async function exists(path: string) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

export async function verifyOutputs(manifest: JobManifest) {
  const missing: string[] = [];

  for (const page of manifest.pages) {
    if (!(await exists(page.printPdf))) missing.push(page.printPdf);
    if (!(await exists(page.cutPdf))) missing.push(page.cutPdf);
  }

  if (missing.length > 0) {
    throw new Error(
      "VectorCraft job finished but required output files are missing:\n" +
      missing.map((path) => `  - ${path}`).join("\n")
    );
  }
}
