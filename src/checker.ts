import { type HTMLElement, parse } from 'node-html-parser';
import { MAX_CONTENT_LENGTH, MAX_JSON_RECURSE_DEPTH } from './constants.ts';
import type { WebmentionType } from './db.ts';

interface FoundUrl {
	url: URL;
	type: WebmentionType;
	content?: string;
}

export async function checkHTMLIncludesDest(sourceUrl: URL, destUrl: URL, abortController: AbortController) {
	const response = await fetch(sourceUrl, {
		method: 'GET',
		signal: abortController.signal
	});

	if (!response.ok) {
		return false;
	}

	const contentType = response.headers.get('Content-Type') ?? '';
	if (!contentType.startsWith('text/html') && !contentType.startsWith('application/xhtml+xml')) {
		return false;
	}

	const contentLength = response.headers.get('Content-Length');
	if (contentLength && parseInt(contentLength, 10) > MAX_CONTENT_LENGTH) {
		return false;
	}

	const responseText = await response.text();
	const root = parse(responseText);

	const urls: FoundUrl[] = [];
	const handleLink = (type: WebmentionType) => (element: HTMLElement) => {
		const url = element.getAttribute('href') ?? '';

		if (!URL.canParse(url, sourceUrl.toString())) {
			return;
		}

		urls.push({
			// INFO: set `sourceUrl` as the base url to handle relative links and such.
			url: new URL(url, sourceUrl),
			type
		});
	};

	root.querySelectorAll('a, link').forEach(handleLink('mention'));
	root.querySelectorAll(':is(a, link).u-like-of, .h-cite.u-like-of :is(a, link).u-url').forEach(handleLink('reaction'));
	root.querySelectorAll(':is(a, link).u-repost-of, .h-cite.u-repost-of :is(a, link).u-url').forEach(handleLink('repost'));
	root.querySelectorAll(':is(a, link).u-bookmark-of').forEach(handleLink('bookmark'));

	root.querySelectorAll('.h-entry:has(.u-in-reply-to)').forEach((element) => {
		const link = element.querySelector('.u-in-reply-to');
		const url = link?.getAttribute('href') ?? '';

		if (!URL.canParse(url, sourceUrl.toString())) {
			return;
		}

		const content = element.querySelector('p-content')?.toString();

		if (!content) {
			return;
		}

		urls.push({
			// INFO: set `sourceUrl` as the base url to handle relative links and such.
			url: new URL(url, sourceUrl),
			type: 'comment',
			content
		});
	});

	// TODO: de-dupe urls and aggregate types
	const matchingUrls = urls.filter(({ url: link }) => {
		const doesProtocolMatch = link.protocol === destUrl.protocol;
		const doesHostnameMatch = link.hostname === destUrl.hostname;
		const doesPathMatch = link.pathname === destUrl.pathname;

		return doesProtocolMatch && doesHostnameMatch && doesPathMatch;
	});

	return matchingUrls[0] !== undefined;
}

export async function checkTextIncludesDest(sourceUrl: URL, destUrl: URL, abortController: AbortController) {
	const response = await fetch(sourceUrl, {
		method: 'GET',
		signal: abortController.signal
	});

	if (!response.ok) {
		return false;
	}

	if (!response.headers.get('Content-Type')?.startsWith('text/')) {
		return false;
	}

	const contentLength = response.headers.get('Content-Length');
	if (contentLength && parseInt(contentLength, 10) > MAX_CONTENT_LENGTH) {
		return false;
	}

	const text = await response.text();

	return text.includes(`${destUrl.origin}${destUrl.pathname}`);
}

export async function checkJSONIncludesDest(sourceUrl: URL, destUrl: URL, abortController: AbortController) {
	const response = await fetch(sourceUrl, {
		method: 'GET',
		signal: abortController.signal
	});

	if (!response.ok) {
		return false;
	}

	if (!response.headers.get('Content-Type')?.startsWith('application/json')) {
		return false;
	}

	const contentLength = response.headers.get('Content-Length');
	if (contentLength && parseInt(contentLength, 10) > MAX_CONTENT_LENGTH) {
		return false;
	}

	try {
		const json = await response.json();

		const findRecursively = (obj: unknown, depth = 0): boolean => {
			if (depth > MAX_JSON_RECURSE_DEPTH) {
				throw new RangeError('JSON max depth reached');
			}

			if (typeof obj === 'string') {
				if (URL.canParse(obj)) {
					const url = new URL(obj);
					const doesProtocolMatch = url.protocol === destUrl.protocol;
					const doesHostnameMatch = url.hostname === destUrl.hostname;
					const doesPathMatch = url.pathname === destUrl.pathname;

					return doesProtocolMatch && doesHostnameMatch && doesPathMatch;
				}

				return false;
			}

			if (Array.isArray(obj)) {
				return obj.some((child) => findRecursively(child, depth + 1));
			}

			if (typeof obj === 'object' && obj !== null) {
				return Object.values(obj).some((child) => findRecursively(child, depth + 1));
			}

			return false;
		};

		return findRecursively(json);
	} catch (err) {
		console.error(err);

		return false;
	}
}
