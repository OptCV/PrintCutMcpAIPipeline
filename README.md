# Print/Cut Automation — Bun + TypeScript + VectorCraft MCP

A minimal print-and-cut production pipeline based on the production behavior of
the supplied Illustrator JSX, but separated into:

- deterministic TypeScript layout logic
- VectorCraft MCP rendering/export
- a small AI agent that executes the already-calculated manifest

The AI does **not** decide nesting geometry.

## Workflow

```text
D:\PrintCut\inbox
        |
        v
filename size parser
        |
        +--> asks for missing/overridden final sizes
        |
        v
batch questions
  - final max PDF width (48" default)
  - final max PDF length / split threshold
  - bleed
  - allow 90° rotation
        |
        v
multi-start MaxRects
        |
        v
manifest.json
        |
        v
VectorCraft MCP
        |
        +--> JOB_P01_PRINT.pdf
        +--> JOB_P01_CUT.pdf
        +--> JOB_P02_PRINT.pdf   (when split)
        +--> JOB_P02_CUT.pdf
```

## Output contract

Every PDF panel is built from one master layout.

### PRINT

Visible:
- artwork
- registration marks

Hidden:
- cut paths

### CUT

Visible:
- rectangular cut paths
- the exact same registration marks

Hidden:
- artwork

The program verifies that every requested PRINT/CUT file exists before moving
the source artwork out of the inbox.

## Final size and bleed

A filename such as:

```text
customer-logo_12x18.png
```

means:

```text
finished cut size = 12 x 18 inches
```

With 0.125-inch bleed:

```text
cut rectangle    = 12 x 18
print artwork box = 12.25 x 18.25
```

The cut size never changes because bleed was requested.

The renderer is instructed to preserve aspect ratio and proportionally
fill/crop the slightly larger bleed box rather than stretching artwork.

## Registration marks

Defaults inherited from the supplied Illustrator JSX:

- solid process black / 100 K
- diameter: 0.25 in
- offset from outer artwork: 0.25 in
- four outside corner marks
- one asymmetric orientation mark
- on long layouts, additional marks after 48 in at 42 in spacing

The mark coordinates are calculated only once and reused by both PRINT and CUT.

## Width and length limits

Unlike the older Illustrator script, the values entered here refer to the
**final exported PDF dimensions including registration marks**.

Example:

```text
maximum PDF width = 48 in
maximum PDF length = 96 in
```

No generated panel may exceed 48 x 96 in.

If the full batch cannot fit into one panel, the nesting engine creates multiple
bins and therefore multiple synchronized output pairs.

## Nesting strategy

The old JSX used a MaxRects-style algorithm with one short-side-fit strategy.

This project keeps MaxRects but improves the search. It runs:

- Best Short Side Fit
- Best Area Fit
- Best Long Side Fit
- Bottom-Left

against these deterministic item orders:

- descending area
- descending largest side
- descending width
- descending height
- descending perimeter

The winner is ranked by:

1. fewest PDF panels
2. least combined used rectangular area
3. least combined used length

This is a practical production heuristic, not a proof of globally optimal 2D
packing. It is intentionally much lighter than genetic/tabu/ILP solvers.

## Accepted extensions

The inbox scanner currently recognizes:

```text
.pdf
.png
.jpg
.jpeg
.tif
.tiff
.bmp
.gif
.webp
.svg
.svgz
.ai
.eps
```

Actual fidelity still depends on what the installed VectorCraft build can open.

Phase 1 treats each dropped file as one artwork item. A multi-page PDF that
requires choosing a particular page is not guessed. The renderer is instructed
to stop rather than silently select the wrong page.

## Setup

### 1. Extract

Recommended:

```text
D:\src\print-cut-vectorcraft-mcp
```

### 2. Create production folders

```powershell
Set-ExecutionPolicy -Scope Process Bypass
.\scripts\setup-workspace.ps1
```

This creates:

```text
D:\PrintCut\
├── inbox\
├── jobs\
├── output\
├── archive\
├── error\
└── logs\
```

### 3. Install Bun tooling

```powershell
bun install
```

### 4. Configure VectorCraft MCP

```powershell
Copy-Item .\mcp-servers.example.json .\mcp-servers.json
```

Edit:

```json
"command": "C:\\PATH\\TO\\vectorcraft-cli.exe"
```

The MCP server is intentionally confined to:

```text
D:\PrintCut
```

for both reads and writes.

### 5. Configure environment

```powershell
Copy-Item .\.env.example .\.env
```

Update `MCP_CONFIG_PATH` if the project is not located at:

```text
D:\src\print-cut-vectorcraft-mcp
```

### 6. Test MCP independently

```powershell
claude -p "Use only VectorCraft MCP. List the available VectorCraft tools and do not modify files." `
  --mcp-config .\mcp-servers.json `
  --allowedTools "mcp__vectorcraft" `
  --output-format json
```

## First run: PLAN only

Drop artwork into:

```text
D:\PrintCut\inbox
```

Example:

```text
A_12x18.png
B_18x24.jpg
C.png
```

Run:

```powershell
bun run plan
```

The program asks for:

1. batch name
2. maximum FINAL PDF width (default 48)
3. maximum FINAL PDF length before splitting
4. bleed (default 0.125)
5. whether 90° rotation is allowed
6. missing dimensions for files such as `C.png`

It writes:

```text
D:\PrintCut\jobs\<batch>\manifest.json
```

No VectorCraft rendering occurs in PLAN mode.

Inspect that file first. It contains:

- every input file
- finished size
- rotation
- exact artwork/bleed bounds
- exact cut bounds
- exact registration mark coordinates
- panel dimensions
- matching PRINT/CUT output names

## Production run

With artwork in the inbox:

```powershell
bun run process
```

Output:

```text
D:\PrintCut\output\<batch>\
```

Example one-panel job:

```text
MYJOB_P01_PRINT.pdf
MYJOB_P01_CUT.pdf
```

Example split job:

```text
MYJOB_P01_PRINT.pdf
MYJOB_P01_CUT.pdf
MYJOB_P02_PRINT.pdf
MYJOB_P02_CUT.pdf
```

After all expected outputs exist, the original input files move to:

```text
D:\PrintCut\archive\<batch>\
```

## Drop-folder mode

After manual processing is proven:

```powershell
bun run watch
```

The watcher waits until files have stopped changing for four seconds, then
starts one batch. This reduces the risk of starting while Windows is still
copying a large PDF or image.

The console still asks the production questions, because maximum width, maximum
length, bleed, and missing dimensions are job-specific operator decisions.

## Recommended first acceptance test

Use:

```text
A_12x18.png
B_18x24.jpg
C_8x10.png
```

Run `bun run plan` with:

```text
max width: 48
max length: 60
bleed: 0.125
rotation: yes
```

Check the manifest first.

Then run `bun run process`.

In your normal production software, overlay each PRINT and CUT pair and verify:

- exact physical PDF dimensions
- exactly 0.25-inch registration circles
- identical PRINT/CUT registration coordinates
- cut rectangles match the requested final dimensions
- bleed exists outside each cut rectangle
- CUT has no artwork
- PRINT has no visible cut lines
- split jobs remain paired P01/P01, P02/P02, etc.

## Files worth editing first

`src/config.ts`
- fixed production defaults

`src/filename-parser.ts`
- filename naming conventions

`src/maxrects.ts`
- nesting optimization

`src/layout.ts`
- registration geometry and bleed/cut geometry

`prompts/vectorcraft-renderer.md`
- deterministic VectorCraft rendering rules
