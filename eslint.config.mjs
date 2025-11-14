import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import noHardcodedColorsRule from "./eslint-plugins/no-hardcoded-colors.js";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    plugins: {
      "no-hardcoded-colors": {
        rules: {
          "no-hardcoded-colors": noHardcodedColorsRule,
        },
      },
    },
    rules: {
      "no-hardcoded-colors/no-hardcoded-colors": [
        "error",
        {
          message: "Use theme tokens instead of hardcoded colors in sx props",
        },
      ],
    },
  },
]);

export default eslintConfig;
