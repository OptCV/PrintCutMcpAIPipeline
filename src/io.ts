import { mkdir, readdir, rename, stat, writeFile } from "node:fs/promises";
import { extname, resolve } from "node:path";
import { PATHS, SUPPORTED_EXTENSIONS } from "./config";

export async function ensureWorkspace() {
  await Promise.all(Object.values(PATHS).map((path) => mkdir(path, { recursive: true })));
}

export async function listInputFiles() {
  await ensureWorkspace();
  const entries = await readdir(PATHS.inbox, { withFileTypes: true });

  return entries
    .filter((entry) => entry.isFile())
    .filter((entry) => SUPPORTED_EXTENSIONS.has(extname(entry.name).toLowerCase()))
    .map((entry) => resolve(PATHS.inbox, entry.name))
    .sort((a, b) => a.localeCompare(b));
}

export async function writeJson(path: string, value: unknown) {
  await writeFile(path, JSON.stringify(value, null, 2) + "\n", "utf8");
}

export async function fileSignature(paths: string[]) {
  const records: string[] = [];
  for (const path of paths) {
    const info = await stat(path);
    records.push([path, info.size, info.mtimeMs].join(":"));
  }
  return records.join("|");
}

export async function archiveInputs(inputPaths: string[], archiveDir: string) {
  await mkdir(archiveDir, { recursive: true });
  for (const source of inputPaths) {
    const name = source.split(/[\\/]/).pop()!;
    await rename(source, resolve(archiveDir, name));
  }
}
