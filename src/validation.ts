// oxlint-disable typescript/only-throw-error

import { env } from 'cloudflare:workers';
import { ErrorResponse, STATUS_CODES } from './utils.ts';

// TODO: Save blocklist in KV storage
const BLOCKED_DOMAINS: string[] = [];

const ALLOWED_ORIGINS = env.ALLOWED_ORIGINS.split(';');
const ALLOWED_PROTOCOLS = ['http:', 'https:'];
const TARGET_PATHS: string[] = env.TARGET_PATHS.split(';');

function parseSource(source: FormDataEntryValue | null) {
	if (typeof source !== 'string' || !URL.canParse(source)) {
		throw new ErrorResponse('Invalid "source": not a URL');
	}

	const parsedSource = new URL(source);

	if (!ALLOWED_PROTOCOLS.includes(parsedSource.protocol)) {
		throw new ErrorResponse('Invalid "source": protocol is not http nor https');
	}

	if (BLOCKED_DOMAINS.includes(parsedSource.hostname)) {
		throw new ErrorResponse('Domain blocked', STATUS_CODES.FORBIDDEN);
	}

	return parsedSource;
}

function parseTarget(target: FormDataEntryValue | null) {
	if (typeof target !== 'string' || !URL.canParse(target)) {
		throw new ErrorResponse('Invalid "target": not a URL');
	}

	const parsedTarget = new URL(target);

	if (!ALLOWED_PROTOCOLS.includes(parsedTarget.protocol)) {
		throw new ErrorResponse('Invalid "target": protocol is not http nor https');
	}

	if (ALLOWED_ORIGINS.includes(parsedTarget.hostname)) {
		throw new ErrorResponse('Invalid "target": origin it not this website');
	}

	if (!TARGET_PATHS.some((targetPath) => parsedTarget.pathname.startsWith(targetPath))) {
		throw new ErrorResponse('Invalid "target": target does not accept webmentions');
	}

	return parsedTarget;
}

export async function parseWebmentionPatameters(request: Request) {
	const contentType = request.headers.get('Content-Type');

	if (contentType !== 'application/x-www-form-urlencoded' && !contentType?.startsWith('multipart/form-data')) {
		throw new Error('Wrong content type');
	}

	const data = await request.formData();
	const source = parseSource(data.get('source'));
	const target = parseTarget(data.get('target'));

	if (source.href === target.href) {
		throw new ErrorResponse('"source" and "target" are the same');
	}

	// TODO: parse other parameters
	return {
		source,
		target
	};
}
