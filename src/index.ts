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

		await saveWebmention(source.href, webmention);
		return new TextResponse('Webmention created', STATUS_CODES.CREATED);
	} catch (err) {
		if (err instanceof ErrorResponse) {
			return err;
		}

		if (err instanceof Error) {
			return new ErrorResponse(err.message);
		}

		return new ErrorResponse('Oops...', STATUS_CODES.INTERNAL_SERVER_ERROR);
	}
});

router.get('/mentions', () =>
	// TODO: return mentions for a url
	new Response('it works!', {
		status: STATUS_CODES.OKAY,
		headers: {
			'Content-Type': 'text/plain'
		}
	}));

// oxlint-disable-next-line import/no-default-export
export default router;
