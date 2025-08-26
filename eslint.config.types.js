import base from "./eslint.config.js";
import ts from "typescript-eslint";

export default [
    ...base.filter((x) => !x.ignores), // on garde les règles
    // override type-aware uniquement pour /src
    ...ts.configs.recommendedTypeChecked,
    {
        files: ["src/**/*.{ts,svelte}"],
        languageOptions: {
            parserOptions: {
                project: ["./tsconfig.eslint.json"],
            },
        },
    },
];
