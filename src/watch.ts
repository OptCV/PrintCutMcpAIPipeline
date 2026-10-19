import { DROP_SETTLE_MS } from "./config";
import { fileSignature, listInputFiles } from "./io";
import { processInbox } from "./process";

let lastSignature = "";
let stableSince = 0;
let processing = false;

console.log("Watching the Print/Cut inbox.");
console.log(`A batch starts after files remain unchanged for ${DROP_SETTLE_MS} ms.`);
console.log(
  "The console will ask for width, split length, bleed, and any missing dimensions."
);
console.log("");

for (;;) {
  if (!processing) {
    const files = await listInputFiles();

    if (files.length === 0) {
      lastSignature = "";
      stableSince = 0;
    } else {
      const signature = await fileSignature(files);

      if (signature !== lastSignature) {
        lastSignature = signature;
        stableSince = Date.now();
      } else if (
        stableSince > 0 &&
        Date.now() - stableSince >= DROP_SETTLE_MS
      ) {
        processing = true;

        try {
          await processInbox();
        } catch (error) {
          console.error("");
          console.error(error instanceof Error ? error.message : String(error));
          console.error(
            "Input artwork was left in the inbox so you can correct the issue and retry."
          );
        } finally {
          processing = false;
          lastSignature = "";
          stableSince = 0;
        }
      }
    }
  }

  await Bun.sleep(1000);
}
