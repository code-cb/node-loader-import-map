import { resolve } from "node:path";
import { defineConfig } from "rollup";
import ts from "rollup-plugin-ts";

const CWD = process.cwd();

const config = defineConfig({
  input: resolve(CWD, "src/index.ts"),
  output: {
    format: "esm",
    dir: resolve(CWD, "dist"),
  },
  external: [/^node:.*$/],
  plugins: [ts()],
});

export default config;
