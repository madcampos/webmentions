// oxlint-disable typescript/consistent-type-assertions typescript/no-unsafe-type-assertion

import { beforeEach, describe, expect, test, vi } from 'vitest';
import * as constants from './constants.ts';
import { fetchHeaders, processResponseBody } from './fetch.ts';
import { ErrorResponse } from './utils.ts';

const MOCK_TIMEOUT = 10;

beforeEach(() => {
	vi.resetAllMocks();
	vi.unstubAllGlobals();
	vi.useRealTimers();
	vi.spyOn(constants, 'FETCH_TIMEOUT_MS', 'get').mockReturnValue(MOCK_TIMEOUT);
});

describe('fetchHeaders', () => {
	test('When the request is successful, then it should resolve correctly', async () => {
		const response = new Response('ok');
		// INFO: we have to mock `fetch` because it errors on workers when called outside of a handler
		vi.stubGlobal(
			'fetch',
			vi.fn(async () => Promise.resolve(response))
		);

		const abortController = new AbortController();
		const fetchPromise = fetchHeaders('https://example.com', abortController);

		await expect(fetchPromise).resolves.toBe(response);
	});

	test('When the abort controller triggers, then it should reject the request', async () => {
		// INFO: we have to mock `fetch` because it errors on workers when called outside of a handler
		vi.stubGlobal(
			'fetch',
			vi.fn(async (_, { signal }: { signal: AbortSignal }) =>
				new Promise((resolve, reject) => {
					setTimeout(() => {
						resolve(new Response('ok'));
					}, MOCK_TIMEOUT);

					signal.addEventListener('abort', () => {
						reject(new Error('fetch rejected'));
					});
				})
			)
		);

		const abortController = new AbortController();
		const fetchPromise = fetchHeaders('https://example.com', abortController);
		abortController.abort();

		await expect(fetchPromise).rejects.toThrow();
	});

	test('When the request exceeds the timeout, then it should be rejected', async () => {
		// INFO: we have to mock `fetch` because it errors on workers when called outside of a handler
		vi.stubGlobal(
			'fetch',
			vi.fn(async (_, { signal }: { signal: AbortSignal }) =>
				new Promise((resolve, reject) => {
					setTimeout(() => {
						resolve(new Response('ok'));
					}, MOCK_TIMEOUT + 1);

					signal.addEventListener('abort', () => {
						reject(new Error('fetch rejected'));
					});
				})
			)
		);

		const abortController = new AbortController();
		const fetchPromise = fetchHeaders('https://example.com', abortController);

		await expect(fetchPromise).rejects.toThrow();
	});
});

describe('processResponseBody', () => {
	test('When the signal is already aborted, then it should return an empty string', async () => {
		const abortController = new AbortController();
		abortController.abort();
		const response = {
			body: {
				getReader: vi.fn()
			}
		} as unknown as Response;

		const result = await processResponseBody(response, abortController);

		expect(result).toBe('');
		expect(response.body?.getReader).not.toHaveBeenCalled();
	});

	test('When the body is valid, then it should return the parsed body', async () => {
		const abortController = new AbortController();
		const mockText = 'Hello World';

		const result = await processResponseBody(new Response(mockText), abortController);

		expect(result).toBe(mockText);
	});

	test('When the body exceeds the maximum length, then it should throw an ErrorResponse', async () => {
		const abortController = new AbortController();
		const response = new Response(new Uint8Array(constants.MAX_CONTENT_LENGTH + 1));

		await expect(processResponseBody(response, abortController)).rejects.toBeInstanceOf(ErrorResponse);
		expect(abortController.signal.aborted).toBe(true);
	});

	test('When the signal is aborted during processing, then it should throw an ErrorResponse', async () => {
		const abortController = new AbortController();

		const reader = {
			// oxlint-disable-next-line typescript/require-await
			read: vi.fn().mockImplementation(async () => {
				abortController.abort();
				return { done: false, value: new TextEncoder().encode('') };
			}),
			cancel: vi.fn()
		};
		const response = {
			body: {
				getReader: () => reader
			}
		} as unknown as Response;

		await expect(processResponseBody(response, abortController)).rejects.toBeInstanceOf(ErrorResponse);
	});
});
