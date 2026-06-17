import { type HTMLElement, parse } from 'node-html-parser';
import type { WebmentionType } from './db.ts';
import { ErrorResponse, STATUS_CODES } from './utils.ts';

export interface ParsedWebmention {
	url: URL;
	type: WebmentionType;
	content?: string;
	author?: {
		name: string,
		avatar?: string,
		link?: string
	};
}

class ElementStripper {
	element(element: Element) {
		if (!element.removed) {
			element.removeAndKeepContent();
		}
	}

	comments(comment: Comment) {
		if (!comment.removed) {
			comment.remove();
		}
	}
}

async function cleanHTMLString(htmlString: string) {
	const rewriter = new HTMLRewriter();

	rewriter.on('*', new ElementStripper());
	const result = rewriter.transform(new Response(htmlString));

	return result.text();
}

export function getWebmentionFromHtml(text: string, sourceUrl: URL, targetUrl: URL) {
	const root = parse(text);

	const urls: ParsedWebmention[] = [];
	const handleSimpleLink = (type: WebmentionType) => (element: HTMLElement) => {
		const urlString = element.getAttribute('href') ?? '';

		// INFO: set `sourceUrl` as the base url to handle relative links and such.
		if (!URL.canParse(urlString, sourceUrl.toString())) {
			return;
		}

		if (urls.find(({ url: existingUrl }) => existingUrl.href === targetUrl.href)) {
			return;
		}

		urls.push({
			url: targetUrl,
			type
		});
	};

	root.querySelectorAll('.h-entry:has(a.u-in-reply-to)').forEach(async (element) => {
		const link = element.querySelector('.u-in-reply-to');
		const url = link?.getAttribute('href') ?? '';

		// INFO: set `sourceUrl` as the base url to handle relative links and such.
		if (!URL.canParse(url, sourceUrl.toString())) {
			return;
		}

		const content = element.querySelector('.p-content, .e-content')?.textContent ?? element.querySelector('.p-summary')?.textContent ??
			element.querySelector('.p-name')?.textContent;

		if (!content) {
			return;
		}

		const author = {
			name: element.querySelector('.u-author .p-name')?.textContent,
			avatar: element.querySelector('.u-author .u-photo')?.getAttribute('src'),
			link: element.querySelector('a.u-author, .u-author a')?.getAttribute('href') ?? root.querySelector('link[rel="author"]')?.getAttribute('href')
		};

		urls.push({
			url: targetUrl,
			type: 'comment',
			content: await cleanHTMLString(content),
			...(author.name ? author : {})
		});
	});

	root.querySelectorAll(':is(a, link).u-like-of, .h-cite.u-like-of :is(a, link).u-url').forEach(handleSimpleLink('reaction'));
	root.querySelectorAll(':is(a, link).u-repost-of, .h-cite.u-repost-of :is(a, link).u-url').forEach(handleSimpleLink('repost'));
	root.querySelectorAll(':is(a, link).u-bookmark-of').forEach(handleSimpleLink('bookmark'));
	root.querySelectorAll('a, link').forEach(handleSimpleLink('mention'));

	const matchingUrls = urls.filter(({ url: link }) => {
		const doesProtocolMatch = link.protocol === targetUrl.protocol;
		const doesHostnameMatch = link.hostname === targetUrl.hostname;
		const doesPathMatch = link.pathname === targetUrl.pathname;

		return doesProtocolMatch && doesHostnameMatch && doesPathMatch;
	});

	return matchingUrls[0];
}

export function getWebmentionFromText(text: string, targetUrl: URL) {
	if (!text.includes(`${targetUrl.origin}${targetUrl.pathname}`)) {
		return;
	}

	return {
		url: targetUrl,
		type: 'mention'
	} satisfies ParsedWebmention;
}

export function getWebmentionFromJson(text: string, targetUrl: URL) {
	try {
		const json = JSON.parse(text);

		if (typeof json === 'object' && json === null) {
			return;
		}

		const stack = Array.isArray(json) ? json : [json];
		while (stack.length > 0) {
			const obj = stack.pop();

			if (typeof obj === 'string') {
				if (URL.canParse(obj)) {
					const url = new URL(obj);
					const doesProtocolMatch = url.protocol === targetUrl.protocol;
					const doesHostnameMatch = url.hostname === targetUrl.hostname;
					const doesPathMatch = url.pathname === targetUrl.pathname;

					// oxlint-disable-next-line max-depth
					if (doesProtocolMatch && doesHostnameMatch && doesPathMatch) {
						return {
							url: targetUrl,
							type: 'mention'
						} satisfies ParsedWebmention;
					}
				}
			}

			if (Array.isArray(obj)) {
				stack.push(...obj);
			} else if (typeof obj === 'object' && obj !== null) {
				stack.push(...Object.values(obj));
			}
		}

		return undefined;
	} catch (err) {
		console.error(err);

		// oxlint-disable-next-line typescript/only-throw-error
		throw new ErrorResponse('Unable to parse JSON.', STATUS_CODES.BAD_REQUEST);
	}
}
