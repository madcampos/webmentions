// oxlint-disable typescript/only-throw-error

import { deleteMention, hasExistingMention, saveWebmention, updateWebmention } from './db.js';
import { fetchHeaders, processResponseBody } from './fetch.js';
import { getWebmentionFromHtml, getWebmentionFromJson, getWebmentionFromText, type ParsedWebmention } from './parser.js';
import { Router } from './router.js';
import { ErrorResponse, STATUS_CODES, TextResponse } from './utils.js';
import { parseWebmentionPatameters, validateFetchResponse } from './validation.js';

const router = new Router();

router.get('/', () => new TextResponse('it works!'));

router.post('/', async (request) => {
	try {
		const { source, target } = await parseWebmentionPatameters(request);

		const response = await fetchHeaders(source);
		const { contentType, status } = validateFetchResponse(response);

		const hasMention = await hasExistingMention(source.href, target.href);

		if (status === STATUS_CODES.GONE) {
			if (!hasMention) {
				throw new ErrorResponse('Web mention does not exist.', STATUS_CODES.NOT_FOUND);
			}

			await deleteMention(source.href, target.href);
			return new TextResponse('Webmention deleted');
		}

		const responseText = await processResponseBody(response);

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
				throw new ErrorResponse("Source doesn't mention target", STATUS_CODES.NOT_FOUND);
			}

			await deleteMention(source.href, target.href);
			return new TextResponse('Webmention deleted');
		}

		if (hasMention) {
			await updateWebmention(source.href, webmention);
			return new TextResponse('Webmention updated', STATUS_CODES.ACCEPTED);
		}


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
