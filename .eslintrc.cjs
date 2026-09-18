module.exports = {
  root: true,
  env: {
    browser: true,
    es2022: true,
    node: true,
  },
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
    ecmaFeatures: {
      jsx: true,
    },
  },
  plugins: ["@typescript-eslint"],
  extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended"],
  ignorePatterns: [
    "**/dist/**",
    "**/node_modules/**",
    "**/.expo/**",
    "apps/backend/auth-server-backup.ts",
    "apps/backend/auth-server.ts",
    "apps/backend/complete-server.ts",
    "apps/backend/full-server.ts",
    "apps/backend/minimal-server.ts",
    "apps/backend/prisma/seedTranslations.ts",
  ],
  rules: {
    "no-empty": ["error", { allowEmptyCatch: true }],
    "no-undef": "off",
    "no-unused-vars": "off",
    "@typescript-eslint/no-explicit-any": "off",
    "@typescript-eslint/no-namespace": "off",
    "@typescript-eslint/no-unused-vars": [
      "warn",
      {
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_",
      },
    ],
  },
};
