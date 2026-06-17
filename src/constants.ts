// oxlint-disable no-magic-numbers

import { env } from 'cloudflare:workers';

export const PROCESS_TIMEOUT = 1000 * 60 * 2;
export const ALLOWED_ORIGINS = env.ALLOWED_ORIGINS.split(';');
export const ALLOWED_PROTOCOLS = ['http:', 'https:'];
export const TARGET_PATHS: string[] = env.TARGET_PATHS.split(';');
export const MAX_CONTENT_LENGTH = 5 * 1024 * 1024;
export const DEFAULT_WINDOW_SIZE = 5;
export const DEFAULT_WEBMENTION_TIMEOUT_MS = 1 * 60 * 60 * 1000;
export const MAX_JSON_RECURSE_DEPTH = 20;
export const MAX_CONTENT_STRING_SIZE = 1024;
export const MAX_URI_LENGTH = 8000;
export const MIN_ITEMS_PER_PAGE = 10;
export const DEFAULT_ITEMS_PER_PAGE = 20;
export const MAX_ITEMS_PER_PAGE = 100;
