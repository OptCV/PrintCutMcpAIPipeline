import { basename, resolve } from "node:path";
import { mkdir } from "node:fs/promises";
import { DEFAULTS, PATHS } from "./config";
import { parseDimensionsFromFilename } from "./filename-parser";
import { listInputFiles, writeJson } from "./io";
import { askNumber, askText, askYesNo } from "./questions";
import { buildManifest } from "./layout";
import type { JobManifest, SourceAsset } from "./types";

function safeBatchId(value: string) {
  const cleaned = value
    .trim()
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (!cleaned) throw new Error("Batch name cannot be empty.");
  return cleaned;
}

function defaultBatchId() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return [
    d.getFullYear(), pad(d.getMonth() + 1), pad(d.getDate()), "-",
    pad(d.getHours()), pad(d.getMinutes()), pad(d.getSeconds())
  ].join("");
}

export async function buildJobFromInbox(): Promise<{
  manifest: JobManifest;
  manifestPath: string;
  inputPaths: string[];
}> {
  const inputPaths = await listInputFiles();

  if (inputPaths.length === 0) {
    throw new Error(`No supported artwork files found in ${PATHS.inbox}`);
  }

  console.log("");
  console.log(`Found ${inputPaths.length} artwork file(s):`);
  for (const path of inputPaths) console.log(`  - ${basename(path)}`);
  console.log("");

  const batchId = safeBatchId(askText("Batch name", defaultBatchId()));

  const maxPdfWidthIn = askNumber(
    "Maximum FINAL PDF width in inches",
    DEFAULTS.maxPdfWidthIn,
    { minExclusive: 0 }
  );

  const maxPdfLengthIn = askNumber(
    "Maximum FINAL PDF length before splitting in inches",
    undefined,
    { minExclusive: 0 }
  );

  const bleedIn = askNumber(
    "Bleed to add OUTSIDE finished size in inches",
    DEFAULTS.bleedIn,
    { minInclusive: 0 }
  );

  const allowRotation = askYesNo(
    "Allow 90-degree rotation while nesting",
    DEFAULTS.allowRotation
  );

  const assets: SourceAsset[] = [];

  for (let index = 0; index < inputPaths.length; index++) {
    const sourcePath = inputPaths[index];
    const fileName = basename(sourcePath);
    const parsed = parseDimensionsFromFilename(sourcePath);

    let finishedWidthIn: number;
    let finishedHeightIn: number;

    console.log("");
    console.log(`[${index + 1}/${inputPaths.length}] ${fileName}`);

    if (parsed) {
      finishedWidthIn = parsed.widthIn;
      finishedHeightIn = parsed.heightIn;
      console.log(
        `  Filename size detected: ${finishedWidthIn} x ${finishedHeightIn} in`
      );

      const keep = askYesNo("  Use this as the FINAL cut size", true);

      if (!keep) {
        finishedWidthIn = askNumber(
          "  Final width in inches",
          finishedWidthIn,
          { minExclusive: 0 }
        );
        finishedHeightIn = askNumber(
          "  Final height in inches",
          finishedHeightIn,
          { minExclusive: 0 }
        );
      }
    } else {
      console.log("  No WxH dimensions detected in filename.");
      finishedWidthIn = askNumber(
        "  Final width in inches",
        undefined,
        { minExclusive: 0 }
      );
      finishedHeightIn = askNumber(
        "  Final height in inches",
        undefined,
        { minExclusive: 0 }
      );
    }

    assets.push({
      id: `item-${String(index + 1).padStart(3, "0")}`,
      fileName,
      sourcePath,
      finishedWidthIn,
      finishedHeightIn,
      bleedIn
    });
  }

  const manifest = buildManifest({
    batchId,
    assets,
    maxPdfWidthIn,
    maxPdfLengthIn,
    bleedIn,
    itemGapIn: DEFAULTS.itemGapIn,
    allowRotation
  });

  const jobDir = resolve(PATHS.jobs, batchId);
  await mkdir(jobDir, { recursive: true });

  const manifestPath = resolve(jobDir, "manifest.json");
  await writeJson(manifestPath, manifest);

  console.log("");
  console.log("Layout planned:");
  console.log(`  PDF panel pairs: ${manifest.pages.length}`);

  manifest.pages.forEach((page) => {
    console.log(
      `  P${String(page.page).padStart(2, "0")}: ` +
      `${page.documentWidthIn}" x ${page.documentHeightIn}" ` +
      `(${page.items.length} item(s))`
    );
  });

  return { manifest, manifestPath, inputPaths };
}
