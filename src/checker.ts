import { parse } from 'node-html-parser';
import { MAX_CONTENT_LENGTH } from './constants.ts';
import type { WebmentionType } from './db.ts';

interface FoundUrl {
	url: URL;
	type: WebmentionType;
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

	root.querySelectorAll('a, link').forEach((element) => {
		const url = element.getAttribute('href') ?? '';

		if (URL.canParse(url, sourceUrl.toString())) {
			urls.push({
				// INFO: set `sourceUrl` as the base url to handle relative links and such.
				url: new URL(url, sourceUrl),
				type: 'mention'
			});
		}
	});

	root.querySelectorAll(':is(a, link).u-like-of, .h-cite.u-like-of :is(a, link).u-url').forEach((element) => {
		const url = element.getAttribute('href') ?? '';

		if (URL.canParse(url, sourceUrl.toString())) {
			urls.push({
				// INFO: set `sourceUrl` as the base url to handle relative links and such.
				url: new URL(url, sourceUrl),
				type: 'reaction'
			});
		}
	});

	root.querySelectorAll(':is(a, link).u-repost-of, .h-cite.u-repost-of :is(a, link).u-url').forEach((element) => {
		const url = element.getAttribute('href') ?? '';

		if (URL.canParse(url, sourceUrl.toString())) {
			urls.push({
				// INFO: set `sourceUrl` as the base url to handle relative links and such.
				url: new URL(url, sourceUrl),
				type: 'repost'
			});
		}
	});

	root.querySelectorAll(':is(a, link).u-bookmark-of').forEach((element) => {
		const url = element.getAttribute('href') ?? '';

		if (URL.canParse(url, sourceUrl.toString())) {
			urls.push({
				// INFO: set `sourceUrl` as the base url to handle relative links and such.
				url: new URL(url, sourceUrl),
				type: 'bookmark'
			});
		}
	});

	root.querySelectorAll('.h-entry:has(.u-in-reply-to)').forEach((element) => {
		const link = element.querySelector('.u-in-reply-to');
		const url = link?.getAttribute('href') ?? '';

		if (URL.canParse(url, sourceUrl.toString())) {
			const content = element.querySelector('p-content')?.toString() ?? '';

			urls.push({
				// INFO: set `sourceUrl` as the base url to handle relative links and such.
				url: new URL(url, sourceUrl),
				type: 'comment'
				// TODO: get reply/comment content
			});
		}
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

		const search = (obj: unknown): boolean => {
			if (typeof obj === 'string') {
				if (URL.canParse(obj)) {
					const url = new URL(obj);
					return (
						url.protocol === destUrl.protocol &&
						url.hostname === destUrl.hostname &&
						url.pathname === destUrl.pathname
					);
				}
				return obj === destUrl.toString();
			}

			if (Array.isArray(obj)) {
				return obj.some(search);
			}

			if (typeof obj === 'object' && obj !== null) {
				return Object.values(obj).some(search);
			}

			return false;
		};

		return search(json);
	} catch (err) {
		console.error(err);

		return false;
	}
}
