// oxlint-disable typescript/only-throw-error

import { checkHTMLIncludesDest, checkJSONIncludesDest, checkTextIncludesDest } from './checker.js';
import { deleteMention, hasExistingMention, saveWebmention, updateWebmention } from './db.js';
import { Router } from './router.js';
import { ErrorResponse, STATUS_CODES, TextResponse } from './utils.js';
import { parseWebmentionPatameters } from './validation.js';

// oxlint-disable-next-line no-magic-numbers
const PROCESS_TIMEOUT = 1000 * 60 * 2;

const router = new Router();

router.get('/', () => new TextResponse('it works!'));

router.post('/', async (request) => {
	try {
		const { source, target } = await parseWebmentionPatameters(request);

		const timeoutController = new AbortController();

		setTimeout(() => timeoutController.abort(), PROCESS_TIMEOUT);

		const response = await fetch(source, { signal: timeoutController.signal });

		if (!response.ok && response.status !== STATUS_CODES.GONE) {
			throw new ErrorResponse('Unable to fetch source');
		}

		const hasMention = await hasExistingMention(source.href, target.href);

		if (response.status === STATUS_CODES.GONE) {
			if (!hasMention) {
				throw new ErrorResponse('Web mention does not exist');
			}

			await deleteMention(source.href, target.href);
			return new TextResponse('Webmention deleted');
		}

		const contentType = response.headers.get('Content-Type');

		let sourceHasTarget = false;

		if (contentType?.includes('text/html')) {
			sourceHasTarget = await checkHTMLIncludesDest(response, source, target);
		} else if (contentType?.includes('application/json')) {
			sourceHasTarget = await checkJSONIncludesDest(response, target);
		} else {
			sourceHasTarget = await checkTextIncludesDest(response, target);
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

router.post('/block', () =>
	// TODO: create blocklist and ban domains

	new Response('it works!', {
		status: STATUS_CODES.OKAY,
		headers: {
			'Content-Type': 'text/plain'
		}
	}));

// oxlint-disable-next-line import/no-default-export
export default router;
