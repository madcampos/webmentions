import { env } from 'cloudflare:workers';

export type WebmentionType = 'comment' | 'mention' | 'reaction' | 'repost' | 'bookmark';

export interface Webmention {
	source: string;
	target: string;
	type: WebmentionType;
	created_at: string;
	updated_at: string | null;
	deleted_at: string | null;
}

export async function hasExistingMention(source: string, target: string) {
	const { count = 0 } = (await env.Database.prepare(/* sql */ `
		SELECT COUNT(*) as count
		FROM webmentions
		WHERE
			source = ?
			AND target = ?
			AND deleted_at IS NULL
	`).bind(source, target).first<{ count: number }>()) ?? {};

	return count > 0;
}

export async function deleteMention(source: string, target: string) {
	const { success } = await env.Database.prepare(/* sql */ `
		UPDATE webmentions
		SET deleted_at = strftime('%Y-%m-%dT%H:%M:%SZ', 'now')
		WHERE
			source = ?
			AND target = ?
	`).bind(source, target).run();

	return success;
}

export async function saveWebmention(source: string, target: string, type: WebmentionType = 'mention') {
	const { success } = await env.Database.prepare(/* sql */ `
		INSERT INTO webmentions
			(source, target, type)
		VALUES
			(?, ?, ?)
		ON CONFLICT(source, target) DO NOTHING
	`).bind(source, target, type).run();

	return success;
}

export async function updateWebmention(source: string, target: string, type: WebmentionType = 'mention') {
	const { success } = await env.Database.prepare(/* sql */ `
		UPDATE webmentions
		SET
			type = ?
			updated_at = strftime('%Y-%m-%dT%H:%M:%SZ', 'now')
		WHERE
			source = ?
			AND target = ?
			AND deleted_at IS NULL
	`).bind(source, target, type).run();

	return success;
}
