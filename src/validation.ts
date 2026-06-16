// oxlint-disable typescript/only-throw-error

import { checkAndBlockOrigin } from './abuse-prevention.ts';
import { ALLOWED_ORIGINS, ALLOWED_PROTOCOLS, TARGET_PATHS } from './constants.ts';
import { ErrorResponse, STATUS_CODES } from './utils.ts';

async function parseSource(source: string | File | null) {
	if (typeof source !== 'string' || !URL.canParse(source)) {
		throw new ErrorResponse('Invalid "source": not a URL');
	}

	const parsedSource = new URL(source);

	if (!ALLOWED_PROTOCOLS.includes(parsedSource.protocol)) {
		throw new ErrorResponse('Invalid "source": protocol is not http nor https');
	}

	const originBlocked = await checkAndBlockOrigin(parsedSource.origin);
	if (originBlocked) {
		throw new ErrorResponse('Origin blocked', STATUS_CODES.FORBIDDEN);
	}

	return parsedSource;
}

function parseTarget(target: string | File | null) {
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
	const source = await parseSource(data.get('source'));
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
