import { MAX_CONTENT_LENGTH, PROCESS_TIMEOUT } from './constants.ts';
import { ErrorResponse, STATUS_CODES } from './utils.ts';

export async function fetchHeaders(url: URL | string) {
	const fetchTimeout = new AbortController();
	let isFetchHeadersFinished = false;

	setTimeout(() => {
		if (fetchTimeout.signal.aborted || !isFetchHeadersFinished) {
			return;
		}

		fetchTimeout.abort(new ErrorResponse('"source" request timeout.', STATUS_CODES.REQUEST_TIMEOUT));
	}, PROCESS_TIMEOUT);

	const response = await fetch(url, {
		method: 'GET',
		signal: fetchTimeout.signal
	});
	isFetchHeadersFinished = true;

	return response;
}

export async function processResponseBody(response: Response) {
	// INFO: clone response to keep the original one from garbage collecting
	const responseClone = response.clone();
	const reader = responseClone.body?.getReader();

	if (!reader) {
		return '';
	}

	const decoder = new TextDecoder();
	let result = '';
	let totalLength = 0;

	// oxlint-disable-next-line @typescript-eslint/no-unnecessary-condition
	while (true) {
		// oxlint-disable no-await-in-loop
		const { done, value } = await reader.read();

		if (done) {
			break;
		}

		totalLength += value.length;

		if (totalLength > MAX_CONTENT_LENGTH) {
			await reader.cancel();

			// oxlint-disable-next-line typescript/only-throw-error
			throw new ErrorResponse('"source" exceeds maximum content length.', STATUS_CODES.CONTENT_TOO_LARGE);
		}

		result += decoder.decode(value, { stream: true });
		// oxlint-enable no-await-in-loop
	}

	result += decoder.decode();

	return result;
}
