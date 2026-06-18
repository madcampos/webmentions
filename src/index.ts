// oxlint-disable typescript/only-throw-error

import { deleteMention, getWebmentionCount, hasExistingMention, listWebmentions, saveWebmention, updateWebmention } from './db.js';
import { fetchHeaders, processResponseBody } from './fetch.js';
import { getWebmentionFromHtml, getWebmentionFromJson, getWebmentionFromText, type ParsedWebmention } from './parser.js';
import { Router } from './router.js';
import { ErrorResponse, JsonResponse, STATUS_CODES, TextResponse } from './utils.js';
import { parseListParams, parseUrl, parseWebmentionPatameters, validateFetchResponse } from './validation.js';

const router = new Router();

router.get('/', () => new TextResponse('it works!'));

router.post('/', async (request) => {
	try {
		const { source, target } = await parseWebmentionPatameters(request);

		const abortController = new AbortController();
		const response = await fetchHeaders(source, abortController);
		const { contentType, status } = validateFetchResponse(response, abortController);

		const hasMention = await hasExistingMention(source.href, target.href);

		if (status === STATUS_CODES.GONE) {
			abortController.abort();

			if (!hasMention) {
				throw new ErrorResponse('Web mention does not exist.', STATUS_CODES.NOT_FOUND);
			}

			await deleteMention(source.href, target.href);
			return new TextResponse('Webmention deleted.');
		}

		const responseText = await processResponseBody(response, abortController);

		let webmention: ParsedWebmention | undefined;
		if (contentType.startsWith('text/html') || contentType.startsWith('application/xhtml+xml')) {
			webmention = getWebmentionFromHtml(responseText, source, target);
		} else if (contentType.startsWith('application/json')) {
			webmention = getWebmentionFromJson(responseText, target);
		} else {
			webmention = getWebmentionFromText(responseText, target);
		}

		if (!webmention) {
			if (!hasMention) {
				throw new ErrorResponse("Source doesn't mention target.", STATUS_CODES.NOT_FOUND);
			}

			await deleteMention(source.href, target.href);
			return new TextResponse('Webmention deleted.');
		}

		if (hasMention) {
			await updateWebmention(source.href, webmention);
			return new TextResponse('Webmention updated.', STATUS_CODES.ACCEPTED);
		}

		await saveWebmention(source.href, webmention);
		return new TextResponse('Webmention created.', STATUS_CODES.CREATED);
	} catch (err) {
		if (err instanceof DOMException && ['TimeoutError', 'AbortError'].includes(err.name)) {
			return new ErrorResponse('"source" request timeout.', STATUS_CODES.REQUEST_TIMEOUT);
		}

		throw err;
	}
});

router.get('/mentions', async (request) => {
	const url = parseUrl(request);

	const totalItems = await getWebmentionCount(url.href);
	const { limit, offset, page, lastPage } = parseListParams(request, totalItems);

	const data = await listWebmentions(url.href, limit, offset);

	return new JsonResponse({
		data,
		start: offset,
		end: offset + data.length,
		total: totalItems,
		size: limit,
		currentPage: page,
		lastPage
	});
});

// oxlint-disable-next-line import/no-default-export
export default router;
