import { applyD1Migrations } from 'cloudflare:test';
import { env } from 'cloudflare:workers';

// @ts-expect-error
await applyD1Migrations(env.Database, env.TEST_MIGRATIONS);
