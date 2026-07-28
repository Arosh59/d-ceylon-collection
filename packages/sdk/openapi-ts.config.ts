import { defineConfig } from "@hey-api/openapi-ts";

export default defineConfig({
  input: "./openapi/v1.json",
  output: {
    path: "./src/generated",
    postProcess: ["prettier"],
  },
  plugins: ["@hey-api/typescript"],
});
