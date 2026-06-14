const cfg = window.__SVELTE_EMBED_CONFIG__;
if (!cfg) {
	throw new Error("Missing window.__SVELTE_EMBED_CONFIG__");
}

const baseUrl = cfg.baseUrl.replace(/\/?$/, "/");
window[cfg.configVar] = { base: baseUrl, assets: baseUrl, env: null };

const container = document.getElementById(cfg.containerId);
if (!container) {
	throw new Error(`Container #${cfg.containerId} not found`);
}

try {
	const { env } = await import(new URL("_app/env.js", baseUrl).href);
	window[cfg.configVar].env = env;
} catch {
	// env.js is optional for this embed
}

const [kit, app] = await Promise.all([
	import(new URL(`_app/immutable/entry/${cfg.startFile}`, baseUrl).href),
	import(new URL(`_app/immutable/entry/${cfg.appFile}`, baseUrl).href)
]);

kit.start(app, container, {
	node_ids: [0, 2],
	data: [null, null],
	form: null,
	error: null
});
