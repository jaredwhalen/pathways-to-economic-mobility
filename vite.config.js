import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import dsv from '@rollup/plugin-dsv';

export default defineConfig({
	envPrefix: ['PUBLIC_', 'MAPBOX_'],
	plugins: [sveltekit(), dsv()]
});
