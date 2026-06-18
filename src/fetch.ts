// oxlint-disable @typescript-eslint/no-unnecessary-condition

import { FETCH_TIMEOUT_MS, MAX_CONTENT_LENGTH } from './constants.ts';
import { ErrorResponse, STATUS_CODES } from './utils.ts';

export async function fetchHeaders(url: URL | string, abortController: AbortController) {
	const response = await fetch(url, {
		method: 'GET',
		signal: AbortSignal.any([
			AbortSignal.timeout(FETCH_TIMEOUT_MS),
			abortController.signal
		])
	});

	return response;
}

export async function processResponseBody(response: Response, abortController: AbortController) {
	if (abortController.signal.aborted) {
		return '';
	}

	const reader = response.body?.getReader();

	if (!reader) {
		return '';
	}

	const decoder = new TextDecoder('utf-8', { fatal: false, ignoreBOM: true });
	let result = '';
	let totalLength = 0;

	while (true) {
		if (abortController.signal.aborted) {
			// oxlint-disable-next-line typescript/only-throw-error
			throw new ErrorResponse('"source" request aborted.');
		}

		// oxlint-disable no-await-in-loop
		const { done, value } = await reader.read();

		if (done) {
			break;
		}

		totalLength += value.length;

		if (totalLength > MAX_CONTENT_LENGTH) {
			await reader.cancel();
			abortController.abort();

			// oxlint-disable-next-line typescript/only-throw-error
			throw new ErrorResponse('"source" exceeds maximum content length.', STATUS_CODES.CONTENT_TOO_LARGE);
		}

		result += decoder.decode(value, { stream: true });
		// oxlint-enable no-await-in-loop
	}

	result += decoder.decode();

	return result;
}
