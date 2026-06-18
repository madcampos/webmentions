import { cloudflareTest, readD1Migrations } from '@cloudflare/vitest-pool-workers';
import path from 'node:path';
import { defineConfig } from 'vitest/config';
import wranglerConfig from './wrangler.json' with { type: 'json' };

// oxlint-disable-next-line import/no-default-export
export default defineConfig({
	plugins: [
		cloudflareTest(async () => {
			const migrationsPath = path.join(import.meta.dirname, 'db/migrations');
			const migrations = await readD1Migrations(migrationsPath);
			const seedsPath = path.join(import.meta.dirname, 'db/seeds');
			const seeds = await readD1Migrations(seedsPath);

			return {
				miniflare: {
					bindings: {
						...wranglerConfig.env.local.vars,
						TEST_MIGRATIONS: [
							...migrations,
							...seeds
						]
					},
					wrangler: { configPath: './wrangler.json' }
				}
			};
		})
	],
	test: {
		coverage: { provider: 'istanbul', enabled: true }
	}
});
