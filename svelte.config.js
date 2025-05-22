import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	kit: {
		adapter: adapter(),
		alias: {
			'$srv': './src/server',
			'$src': './src',
			'$lib': './src/lib',
		},
		csrf: {
			checkOrigin: false,
		},
	},
	vite: {
		ssr: {
			noExternal: ['three']
		},
	},
	compilerOptions: {
		warningFilter: (warning) => (warning.code.startsWith('a11y-')),
	},
};

export default config;
