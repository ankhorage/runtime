import { createKnipConfig } from "@ankhorage/devtools/knip";

export default createKnipConfig({
  ignoreFiles: [
    "eslint.config.mjs",
    "paradox.config.ts",
    "prettier.config.cjs",
    "src/readme-usage.ts",
  ],
});
