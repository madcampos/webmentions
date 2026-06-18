// oxlint-disable no-magic-numbers

import { env } from 'cloudflare:workers';

/** Timeout for fetch request in milliseconds. */
export const FETCH_TIMEOUT_MS = 2 * 60 * 1000;

/** List of allowed origins to send webmentions to. If the origin is not on this list, the webmention will not be received. */
export const ALLOWED_ORIGINS = env.ALLOWED_ORIGINS.split(';');

/** List of allowed protocols to send/recieve webmentions. If either source or target is in any other protocol the webmention will not be recieved. */
export const ALLOWED_PROTOCOLS = ['http:', 'https:'];

/** List of path prefixes for the urls to allow receiving webmentions. E.g.: `/blog/` => all pathnames starting with `/blog/` will receive webmentions. */
export const TARGET_PATHS: string[] = env.TARGET_PATHS.split(';');

/** Maximum allowed content length when fetching the source url. */
export const MAX_CONTENT_LENGTH = 10 * 1024 * 1024;

/** Window size used to check for abuse when sending webmentions. */
export const DEFAULT_WINDOW_SIZE = 5;

/** The delta time for sending multiple webmentions. */
export const DEFAULT_WEBMENTION_DELTA_TIME_MS = 1 * 60 * 60 * 1000;

/** Maximum size for strings saved to the database. */
export const MAX_CONTENT_STRING_SIZE = 1024;

/** Maximum URL length. */
export const MAX_URI_LENGTH = 8000;

/** Minimum number of items per page for pagination listing. */
export const MIN_ITEMS_PER_PAGE = 10;

/** Default number of items per page for pagination listing. */
export const DEFAULT_ITEMS_PER_PAGE = 20;

/** Maximum number of items per page for pagination listing. */
export const MAX_ITEMS_PER_PAGE = 100;
