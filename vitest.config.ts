import { cloudflareTest } from '@cloudflare/vitest-pool-workers';
import { defineConfig } from 'vitest/config';

// oxlint-disable-next-line import/no-default-export
export default defineConfig({
	plugins: [
		cloudflareTest({
			wrangler: { configPath: './wrangler.json' }
		})
	]
});
