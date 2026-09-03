module.exports = {
  moduleFileExtensions: ["js", "json", "ts"],
  rootDir: ".",
  testEnvironment: "node",
  testMatch: ["<rootDir>/test/**/*.spec.ts"],
  transform: {
    "^.+\\.ts$": [
      "ts-jest",
      { tsconfig: "<rootDir>/tsconfig.json", diagnostics: { ignoreCodes: [151002] } },
    ],
  },
  collectCoverageFrom: ["src/**/*.ts", "!src/main.ts"],
};
