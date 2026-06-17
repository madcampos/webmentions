// oxlint-disable typescript/only-throw-error

import { checkAndBlockOrigin } from './abuse-prevention.ts';
import { ALLOWED_ORIGINS, ALLOWED_PROTOCOLS, MAX_CONTENT_LENGTH, TARGET_PATHS } from './constants.ts';
import { ErrorResponse, STATUS_CODES } from './utils.ts';

async function parseSource(source: string | File | null) {
	if (typeof source !== 'string' || !URL.canParse(source)) {
		throw new ErrorResponse('Invalid "source": not a URL', STATUS_CODES.UNPROCESSABLE_CONTENT);
	}

	const parsedSource = new URL(source);

	if (!ALLOWED_PROTOCOLS.includes(parsedSource.protocol)) {
		throw new ErrorResponse('Invalid "source": protocol is not http nor https', STATUS_CODES.UNPROCESSABLE_CONTENT);
	}

	const originBlocked = await checkAndBlockOrigin(parsedSource.origin);
	if (originBlocked) {
		throw new ErrorResponse('Origin blocked', STATUS_CODES.FORBIDDEN);
	}

	return parsedSource;
}

function parseTarget(target: string | File | null) {
	if (typeof target !== 'string' || !URL.canParse(target)) {
		throw new ErrorResponse('Invalid "target": not a URL', STATUS_CODES.UNPROCESSABLE_CONTENT);
	}

	const parsedTarget = new URL(target);

	if (!ALLOWED_PROTOCOLS.includes(parsedTarget.protocol)) {
		throw new ErrorResponse('Invalid "target": protocol is not http nor https', STATUS_CODES.UNPROCESSABLE_CONTENT);
	}

	if (ALLOWED_ORIGINS.includes(parsedTarget.hostname)) {
		throw new ErrorResponse('Invalid "target": origin it not this website', STATUS_CODES.FORBIDDEN);
	}

	if (!TARGET_PATHS.some((targetPath) => parsedTarget.pathname.startsWith(targetPath))) {
		throw new ErrorResponse('Invalid "target": target does not accept webmentions', STATUS_CODES.FORBIDDEN);
	}

	return parsedTarget;
}

export async function parseWebmentionPatameters(request: Request) {
	const contentType = request.headers.get('Content-Type');

	if (contentType !== 'application/x-www-form-urlencoded' && !contentType?.startsWith('multipart/form-data')) {
		throw new ErrorResponse('Wrong content type', STATUS_CODES.UNSUPPORTED_MEDIA_TYPE);
	}

	const data = await request.formData();
	const source = await parseSource(data.get('source'));
	const target = parseTarget(data.get('target'));

	if (source.href === target.href) {
		throw new ErrorResponse('"source" and "target" are the same', STATUS_CODES.UNPROCESSABLE_CONTENT);
	}

	// TODO: implement vouch and salmention
	return {
		source,
		target
	};
}

export function validateFetchResponse(response: Response) {
	if (!response.ok && response.status !== STATUS_CODES.GONE) {
		throw new ErrorResponse('Unable to fetch source');
	}

	const contentLength = response.headers.get('Content-Length');
	if (!contentLength) {
		throw new ErrorResponse('Invalid "source": "Content-Length" header is required on request.', STATUS_CODES.LENGHT_REQUIRED);
	}

	if (Number.parseInt(contentLength, 10) > MAX_CONTENT_LENGTH) {
		throw new ErrorResponse('Source document is too large', STATUS_CODES.CONTENT_TOO_LARGE);
	}

	const contentType = response.headers.get('Content-Type');

	if (!contentType) {
		throw new ErrorResponse('Missing "Content-Type" header', STATUS_CODES.UNSUPPORTED_MEDIA_TYPE);
	}

	const isJson = contentType.startsWith('application/json');
	const isHtml = contentType.startsWith('text/html') || contentType.startsWith('application/xhtml+xml');
	const isXml = contentType.startsWith('text/xml');
	const isMarkdown = contentType.startsWith('text/markdown');
	const isPlainText = contentType.startsWith('text/plain');

	if (!isHtml && !isJson && !isXml && !isMarkdown && !isPlainText) {
		throw new ErrorResponse('Invalid "Content-Type".', STATUS_CODES.UNSUPPORTED_MEDIA_TYPE);
	}

	return {
		contentType,
		contentLength,
		status: response.status,
		ok: response.ok
	};
}
