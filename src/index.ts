import { type Context, Hono } from 'hono';
import type { BlankEnv, BlankInput } from 'hono/types';
import { parse as parseHtml } from 'node-html-parser';
import { STATUS_CODES } from './statusCodes.js';

const app = new Hono();

// TODO: move to external resources/db
const TARGET_URLS: string[] = ['/blog/2024/09/overly-overlays/'];
const BLOCKLIST_DOMAINS: string[] = [];

// TODO: move to env
const BASE_URL = new URL('https://madcampos.dev/');

const ALLOWED_PROTOCOLS = ['http:', 'https:'];
const PROCESS_TIMEOUT = 1000 * 60 * 2;

async function parseParameters(context: Context<BlankEnv, '/', BlankInput>) {
	const contentType = context.req.header('Content-Type');

	if (contentType !== 'application/x-www-form-urlencoded' && !contentType?.startsWith('multipart/form-data')) {
		throw new Error('Wrong content type');
	}

	const data = await context.req.formData();
	const source = data.get('source');
	const target = data.get('target');

	if (typeof source !== 'string' || !URL.canParse(source)) {
		throw new Error('Invalid "source"');
	}

	const parsedSource = new URL(source);

	if (typeof target !== 'string' || !URL.canParse(target)) {
		throw new Error('Invalid "target"');
	}

	if (!ALLOWED_PROTOCOLS.includes(parsedSource.protocol)) {
		throw new Error('Invalid "source" protocol');
	}

	if (BLOCKLIST_DOMAINS.includes(parsedSource.hostname)) {
		throw new Error('GTFO');
	}

	const parsedTarget = new URL(target);

	if (!ALLOWED_PROTOCOLS.includes(parsedTarget.protocol)) {
		throw new Error('Invalid "target" protocol');
	}

	if (BASE_URL.host !== parsedTarget.host) {
		throw new Error('Your princess is in another castle');
	}

	if (parsedSource.href === parsedTarget.href) {
		throw new Error('Paradox not accepted');
	}

	if (!TARGET_URLS.includes(parsedTarget.pathname)) {
		throw new Error("I Don't Think It Means What You Think It Means");
	}

	return {
		source: parsedSource,
		target: parsedTarget
	};
}

async function validateMention(signal: AbortSignal, source: URL, target: URL) {
	const response = await fetch(source, { signal });

	if (!response.ok) {
		throw new Error('Unable to fetch source');
	}

	try {
		const responseText = await response.text();
		const root = parseHtml(responseText);

		// TODO: parse and validate extra data/fields

		const allLinks = root.querySelectorAll('a, link');
		const urlsForLinks = allLinks
			.map((link) => URL.parse(link.getAttribute('href') ?? '', source.toString()))
			.filter((link) => link !== null);
		const matchingUrls = urlsForLinks.filter((link) => link.hostname === target.hostname && link.pathname === target.pathname);

		return matchingUrls;
	} catch (err) {
		console.error(err);

		throw new Error('Unable to process source links');
	}
}

async function processMention(source: URL, target: URL) {
	try {
		const timeoutController = new AbortController();

		setTimeout(() => timeoutController.abort(), PROCESS_TIMEOUT);

		const linksWithTarget = await validateMention(timeoutController.signal, source, target);

		if (linksWithTarget.length < 1) {
			throw new Error("Source doesn't mention target");
		}

		// TODO: check if it is an update

		// TODO: save to db
	} catch (err) {
		console.error(err);
	}
}

app.get('/', (context) => {
	context.status(STATUS_CODES.OKAY);

	return context.text('it works');
});

app.post('/', async (context) => {
	try {
		const { source, target } = await parseParameters(context);

		await processMention(source, target);

		context.status(STATUS_CODES.OKAY);
		return context.text('Your offer was accepted');
	} catch (err) {
		if (err instanceof Error) {
			context.status(STATUS_CODES.BAD_REQUEST);
			return context.text(err.message);
		}

		context.status(STATUS_CODES.INTERNAL_SERVER_ERROR);

		return context.text('Oops...');
	}
});

app.get('/mentions', async (context) => {
	// TODO: retun mentions for url
});

app.post('/block', async (context) => {
	// TODO: create blocklist and ban domains
});

export default app;
