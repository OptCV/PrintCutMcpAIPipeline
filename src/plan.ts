import { buildJobFromInbox } from "./build-job";

const result = await buildJobFromInbox();

console.log("");
console.log("Manifest created:");
console.log(result.manifestPath);
console.log("");
console.log("No files were rendered because this was PLAN mode.");
