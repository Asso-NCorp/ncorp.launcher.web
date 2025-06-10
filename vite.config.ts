import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig, loadEnv } from 'vite';
import fs from 'fs';

export default defineConfig(({ mode }) => {
	process.env = {
		...process.env, ...loadEnv(mode, process.cwd()),
		NODE_TLS_REJECT_UNAUTHORIZED: '0',
	};
	return {
		define: {
			__ORIGIN__: JSON.stringify(process.env.VITE_ORIGIN),
			__PORT__: JSON.stringify(process.env.VITE_PORT),
			'import.meta.env.VITE_APP_VERSION': JSON.stringify(process.env.npm_package_version),
		},
		server: {
			host: process.env.PUBLIC_SERVER_HOST,
			port: 5173,
			https: {
				key: fs.readFileSync(`./.cert/wildcard.n-lan.com.key`),
				cert: fs.readFileSync(`./.cert/wildcard.n-lan.com.pem`)
			}
		},
		plugins: [
			sveltekit(),
		],
	}
});
