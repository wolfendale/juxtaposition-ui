import { Schema, model } from 'mongoose';
import type { HydratedPostDocument, IPost, IPostMethods, PostModel } from '@/types/mongoose/post';

export const PostSchema = new Schema<IPost, PostModel, IPostMethods>({
	id: String,
	title_id: String,
	screen_name: String,
	body: String,
	app_data: String,
	painting: String,
	screenshot: String,
	screenshot_length: Number,
	search_key: {
		type: [String],
		default: undefined
	},
	topic_tag: {
		type: String,
		default: undefined
	},
	community_id: {
		type: String,
		default: undefined
	},
	created_at: Date,
	feeling_id: Number,
	is_autopost: {
		type: Number,
		default: 0
	},
	is_community_private_autopost: {
		type: Number,
		default: 0
	},
	is_spoiler: {
		type: Number,
		default: 0
	},
	is_app_jumpable: {
		type: Number,
		default: 0
	},
	empathy_count: {
		type: Number,
		default: 0,
		min: 0
	},
	country_id: {
		type: Number,
		default: 49
	},
	language_id: {
		type: Number,
		default: 1
	},
	mii: String,
	mii_face_url: String,
	pid: Number,
	platform_id: Number,
	region_id: Number,
	parent: String,
	reply_count: {
		type: Number,
		default: 0
	},
	verified: {
		type: Boolean,
		default: false
	},
	message_to_pid: {
		type: String,
		default: null
	},
	removed: {
		type: Boolean,
		default: false
	},
	removed_reason: String,
	removed_by: Number,
	removed_at: Date,
	yeahs: [Number]
});

PostSchema.method<HydratedPostDocument>('upReply', async function() {
	const replyCount = this.get('reply_count');
	if (replyCount + 1 < 0) {
		this.set('reply_count', 0);
	} else {
		this.set('reply_count', replyCount + 1);
	}

	await this.save();
});

PostSchema.method<HydratedPostDocument>('downReply', async function() {
	const replyCount = this.get('reply_count');
	if (replyCount - 1 < 0) {
		this.set('reply_count', 0);
	} else {
		this.set('reply_count', replyCount - 1);
	}

	await this.save();
});

PostSchema.method<HydratedPostDocument>('removePost', async function(reason: string, pid: number) {
	this.set('removed', true);
	this.set('removed_reason', reason);
	this.set('removed_by', pid);
	this.set('removed_at', new Date());
	await this.save();
});

PostSchema.method<HydratedPostDocument>('unRemove', async function(reason: string) {
	this.set('removed', false);
	this.set('removed_reason', reason);
	await this.save();
});

export const POST = model<IPost, PostModel>('POST', PostSchema);