import prettier from "eslint-config-prettier";
import js from "@eslint/js";
import svelte from "eslint-plugin-svelte";
import globals from "globals";
import ts from "typescript-eslint";

export default [
    // 1) Ignorer ce qui coûte (et svelte.config.js)
    {
        ignores: [
            ".svelte-kit/**",
            "build/**",
            "dist/**",
            "coverage/**",
            "prisma/**",
            "**/*.d.ts",
            "svelte.config.js",
            "vite.config.*",
            "node_modules/**",
        ],
    },

    // 2) JS de base
    js.configs.recommended,

    // 3) TypeScript sans type-check (rapide)
    ...ts.configs.recommended,

    // 4) Svelte recommandé (sans type-check)
    ...svelte.configs["flat/recommended"],

    // 5) Prettier en dernier
    prettier,

    // 6) Réglages globaux
    {
        languageOptions: {
            globals: { ...globals.browser, ...globals.node },
        },
    },

    // 7) Pour .svelte : parser TS pour <script lang="ts">
    {
        files: ["**/*.svelte"],
        languageOptions: {
            parserOptions: {
                parser: ts.parser,
            },
        },
    },
];
