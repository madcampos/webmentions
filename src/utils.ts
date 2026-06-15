export const STATUS_CODES = {
	OKAY: 200,
	CREATED: 201,
	ACCEPTED: 202,
	BAD_REQUEST: 400,
	UNAUTHORIZED: 401,
	FORBIDDEN: 403,
	NOT_FOUND: 404,
	GONE: 410,
	INTERNAL_SERVER_ERROR: 500
} as const;

export type StatusCodes = typeof STATUS_CODES[keyof typeof STATUS_CODES];

export class ErrorResponse extends Response {
	constructor(message: string, status: StatusCodes = STATUS_CODES.BAD_REQUEST) {
		super(message, {
			status,
			headers: { 'Content-Type': 'text/plain' }
		});
	}
}

export class TextResponse extends Response {
	constructor(message: string, status: StatusCodes = STATUS_CODES.OKAY) {
		super(message, {
			status,
			headers: { 'Content-Type': 'text/plain' }
		});
	}
}
