import eslintPluginTs from "@typescript-eslint/eslint-plugin"
import parser from "@typescript-eslint/parser"

export default [
  {
    ignores: ["dist/**", "node_modules/**", ".opencode/**"],
  },
  {
    files: ["**/*.ts"],
    languageOptions: {
      parser,
      parserOptions: {
        project: "./tsconfig.json",
        tsconfigRootDir: import.meta.dirname,
        sourceType: "module",
      },
    },
    plugins: {
      "@typescript-eslint": eslintPluginTs,
    },
    rules: {
      ...eslintPluginTs.configs["recommended-type-checked"].rules,
      ...eslintPluginTs.configs["stylistic-type-checked"].rules,
    },
  },
]
