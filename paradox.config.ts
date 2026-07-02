import { defineParadoxConfig } from "@ankhorage/paradox";

export default defineParadoxConfig({
  mode: "write",
  docs: {
    title: "@ankhorage/runtime",
    description:
      "Platform-neutral runtime contracts and helpers for Ankhorage generated apps.",
    usage: {
      entrypoints: ["src/readme-usage.ts"],
    },
  },
  package: {
    entrypoints: ["src/index.ts"],
  },
  output: {
    dir: "paradox",
  },
});
