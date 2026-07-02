import { createKnipConfig } from "@ankhorage/devtools/knip";

export default createKnipConfig({
  ignoreFiles: ["eslint.config.mjs", "prettier.config.cjs"],
});
