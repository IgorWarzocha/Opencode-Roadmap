// ESLint configuration for TypeScript (type-checked) in an ESM project
module.exports = {
  root: true,
  env: {
    es2024: true,
    node: true,
  },
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: "./tsconfig.json",
    tsconfigRootDir: __dirname,
    sourceType: "module",
  },
  plugins: ["@typescript-eslint"],
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:@typescript-eslint/recommended-type-checked",
    "plugin:@typescript-eslint/stylistic",
    "prettier",
  ],
  ignorePatterns: ["dist/", "node_modules/"],
}
