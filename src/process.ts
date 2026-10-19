import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { buildJobFromInbox } from "./build-job";
import { renderWithVectorCraft } from "./agent";
import { verifyOutputs } from "./verify";
import { archiveInputs } from "./io";
import { PATHS } from "./config";

export async function processInbox() {
  const { manifest, manifestPath, inputPaths } = await buildJobFromInbox();

  await mkdir(resolve(PATHS.output, manifest.batchId), { recursive: true });

  console.log("");
  console.log("Rendering with VectorCraft MCP...");

  const rendered = await renderWithVectorCraft({
    batchId: manifest.batchId,
    manifestPath
  });

  await verifyOutputs(manifest);

  const archiveDir = resolve(PATHS.archive, manifest.batchId);
  await archiveInputs(inputPaths, archiveDir);

  console.log("");
  console.log("DONE");
  console.log(`Output: ${resolve(PATHS.output, manifest.batchId)}`);
  console.log(`Log: ${rendered.logPath}`);
  console.log(`Sources archived: ${archiveDir}`);
}

if (import.meta.main) {
  await processInbox();
}
