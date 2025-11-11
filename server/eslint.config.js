const js = require("@eslint/js");
const globals = require("globals");
const prettierPlugin = require("eslint-plugin-prettier");
const prettierConfig = require("eslint-config-prettier");

module.exports = [
  // 1. Ignore build/dist and node_modules
  { ignores: ["dist", "node_modules"] },

  // 2. Backend ESLint configuration
  {
    files: ["**/*.{js,ts,css}"],
    languageOptions: {
      ecmaVersion: "latest", // Modern JavaScript syntax
      sourceType: "module", // Use "commonjs" if using require/module.exports instead
      globals: {
        ...globals.node, // Node.js built-ins like process, __dirname, etc.
        ...globals.es2021,
      },
    },
    plugins: {
      prettier: prettierPlugin,
    },
    rules: {
      // Base recommended ESLint rules
      ...js.configs.recommended.rules,
      ...prettierConfig.rules, // Disable rules that conflict with Prettier

      // --- Custom rules ---
      "no-unused-vars": "warn", // Warn about unused vars
      semi: ["error", "always"], // Require semicolons
      quotes: ["error", "double"], // Enforce double quotes
      "prettier/prettier": [
        "error",
        {
          semi: true,
          singleQuote: false,
          trailingComma: "es5",
          endOfLine: "auto", // Fixes CRLF/LF issues on Windows
          tabWidth: 2,
          printWidth: 80,
        },
      ],
    },
  },
];
