import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { CLAUDE_BIN, MCP_CONFIG_PATH, PATHS } from "./config";

export async function renderWithVectorCraft(args: {
  batchId: string;
  manifestPath: string;
}) {
  await mkdir(PATHS.logs, { recursive: true });

  const instructionPath = resolve(
    process.cwd(),
    "prompts",
    "vectorcraft-renderer.md"
  );

  const prompt = [
    "Execute the deterministic VectorCraft print/cut job.",
    `Read the renderer instructions from: ${instructionPath}`,
    `Read the exact layout manifest from: ${args.manifestPath}`,
    "",
    "Do not redesign, repack, reinterpret dimensions, or move geometry.",
    "Use only the coordinates and output paths in the manifest.",
    "Use the vectorcraft MCP server for all artwork/document operations.",
    "Complete every PRINT/CUT page pair in the manifest."
  ].join("\n");

  const proc = Bun.spawn(
    [
      CLAUDE_BIN,
      "-p",
      prompt,
      "--mcp-config",
      MCP_CONFIG_PATH,
      "--allowedTools",
      "Read,mcp__vectorcraft",
      "--output-format",
      "json",
      "--max-turns",
      "80"
    ],
    {
      stdin: "ignore",
      stdout: "pipe",
      stderr: "pipe"
    }
  );

  const stdoutPromise = new Response(proc.stdout).text();
  const stderrPromise = new Response(proc.stderr).text();
  const exitCode = await proc.exited;
  const [stdout, stderr] = await Promise.all([stdoutPromise, stderrPromise]);

  const logPath = resolve(PATHS.logs, `${args.batchId}.log`);
  await writeFile(
    logPath,
    [`exitCode=${exitCode}`, "", "STDOUT", stdout, "", "STDERR", stderr].join("\n"),
    "utf8"
  );

  if (exitCode !== 0) {
    throw new Error(
      `Renderer agent exited with code ${exitCode}. See ${logPath}`
    );
  }

  return { logPath, stdout };
}
