import { sveltekit } from "@sveltejs/kit/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, loadEnv } from "vite";
import fs from "fs";

export default defineConfig(({ mode }) => {
    process.env = {
        ...process.env,
        ...loadEnv(mode, process.cwd()),
        NODE_TLS_REJECT_UNAUTHORIZED: "0",
    };
    return {
        define: {
            __ORIGIN__: JSON.stringify(process.env.VITE_ORIGIN),
            __PORT__: JSON.stringify(process.env.VITE_PORT),
            "import.meta.env.VITE_APP_VERSION": JSON.stringify(process.env.npm_package_version),
        },
        optimizeDeps: { exclude: ["sharp"] },
        ssr: {
            // important: laisser sharp résolu à l'exécution
            external: ["sharp", "@img/sharp-linux-x64", "@img/sharp-wasm32"],
        },
        server: {
            host: process.env.PUBLIC_SERVER_HOST,
            port: 443,
            https: {
                key: fs.readFileSync(`./.cert/wildcard.n-lan.com.key`),
                cert: fs.readFileSync(`./.cert/wildcard.n-lan.com.pem`),
            },
        },
        plugins: [tailwindcss(), sveltekit()],
        build: {
            commonjsOptions: {
                ignoreDynamicRequires: true,
            },
        },
    };
});
