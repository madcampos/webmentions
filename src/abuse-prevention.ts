import { DEFAULT_WEBMENTION_TIMEOUT_MS, DEFAULT_WINDOW_SIZE } from './constants.ts';
import { blockOrigin, getRecentOriginMentions, isOriginBlocked } from './db.ts';

export async function checkAndBlockOrigin(origin: string): Promise<boolean> {
	if (await isOriginBlocked(origin)) {
		return true;
	}

	const recentMentions = await getRecentOriginMentions(origin, DEFAULT_WINDOW_SIZE);

	if (recentMentions.length < DEFAULT_WINDOW_SIZE) {
		return false;
	}

	const first = recentMentions.at(0);
	const last = recentMentions.at(-1);

	if (!first || !last) {
		return false;
	}

	const newestMention = new Date(first.created_at);
	const oldestMention = new Date(last.created_at);

	const duration = newestMention.getTime() - oldestMention.getTime();

	if (duration < DEFAULT_WEBMENTION_TIMEOUT_MS) {
		await blockOrigin(origin);
		return true;
	}

	return false;
}
