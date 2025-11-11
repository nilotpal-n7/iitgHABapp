const js = require("@eslint/js");
const globals = require("globals");

module.exports = [
  // 1. Ignore build/distribution directories
  { ignores: ["dist/"] },

  // 2. Main ESLint configuration for all .js files
  {
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: 2022, // Use modern JS
      sourceType: "module", // If you're using import/export
      globals: {
        ...globals.node, // Enable Node.js globals (process, require, etc.)
      },
    },
    plugins: {
      prettier: require("eslint-plugin-prettier"),
    },
    rules: {
      ...js.configs.recommended.rules,

      "no-unused-vars": "warn", // Warn, don't fail build
      "semi": ["error", "always"], // Enforce semicolons
      "quotes": ["error", "double"], // Enforce double quotes
      "prettier/prettier": "error",
    },
  },
];
