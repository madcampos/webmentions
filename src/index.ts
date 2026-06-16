// oxlint-disable typescript/only-throw-error

import { checkHTMLIncludesDest, checkJSONIncludesDest, checkTextIncludesDest } from './checker.js';
import { MAX_CONTENT_LENGTH, PROCESS_TIMEOUT } from './constants.js';
import { deleteMention, hasExistingMention, saveWebmention, updateWebmention } from './db.js';
import { Router } from './router.js';
import { ErrorResponse, STATUS_CODES, TextResponse } from './utils.js';
import { parseWebmentionPatameters } from './validation.js';

const router = new Router();

router.get('/', () => new TextResponse('it works!'));

router.post('/', async (request) => {
	try {
		const { source, target } = await parseWebmentionPatameters(request);

		const prefetchTimeout = new AbortController();

		setTimeout(() => prefetchTimeout.abort(), PROCESS_TIMEOUT);

		const prefetchRequest = await fetch(source, {
			method: 'HEAD',
			signal: prefetchTimeout.signal
		});

		if (!prefetchRequest.ok && prefetchRequest.status !== STATUS_CODES.GONE) {
			throw new ErrorResponse('Unable to fetch source');
		}

		const hasMention = await hasExistingMention(source.href, target.href);

		if (prefetchRequest.status === STATUS_CODES.GONE) {
			if (!hasMention) {
				throw new ErrorResponse('Web mention does not exist');
			}

			await deleteMention(source.href, target.href);
			return new TextResponse('Webmention deleted');
		}

		const contentLength = prefetchRequest.headers.get('Content-Length');
		if (contentLength && parseInt(contentLength, 10) > MAX_CONTENT_LENGTH) {
			throw new ErrorResponse('Source document is too large');
		}

		const contentType = prefetchRequest.headers.get('Content-Type');

		let sourceHasTarget = false;
		const fetchTimeout = new AbortController();

		setTimeout(() => fetchTimeout.abort(), PROCESS_TIMEOUT);

		if (contentType?.startsWith('text/html')) {
			sourceHasTarget = await checkHTMLIncludesDest(source, target, fetchTimeout);
		} else if (contentType?.startsWith('application/json')) {
			sourceHasTarget = await checkJSONIncludesDest(source, target, fetchTimeout);
		} else {
			sourceHasTarget = await checkTextIncludesDest(source, target, fetchTimeout);
		}

		if (!sourceHasTarget) {
			if (!hasMention) {
				throw new ErrorResponse("Source doesn't mention target");
			}

			await deleteMention(source.href, target.href);
			return new TextResponse('Webmention deleted');
		}

		if (hasMention) {
			await updateWebmention(source.href, target.href);
			return new TextResponse('Webmention updated');
		}

		await saveWebmention(source.href, target.href);
		return new TextResponse('Webmention created');
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
