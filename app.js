'use strict';

const fs = require('fs');
const path = require('path');
const Twitter = require('twitter');
const Fanfou = require('fanfou-sdk');
const down = require('download');

const {
	consumerKey: twitterConsumerKey,
	consumerSecret: twitterConsumerSecret,
	accessTokenKey,
	accessTokenSecret
} = require('./twitter.config');

const {
	consumerKey: fanfouConsumerKey,
	consumerSecret: fanfouConsumerSecret,
	oauthToken,
	oauthTokenSecret
} = require('./fanfou.config');

const t = new Twitter({
	consumer_key: twitterConsumerKey,
	consumer_secret: twitterConsumerSecret,
	access_token_key: accessTokenKey,
	access_token_secret: accessTokenSecret
});

const f = new Fanfou({
	consumerKey: fanfouConsumerKey,
	consumerSecret: fanfouConsumerSecret,
	oauthToken,
	oauthTokenSecret
});

let latest = 0;
const downpath = path.join(__dirname, 'images');
const downloadTasks = [];
const postTasks = [];

t.get('statuses/user_timeline', {
	user_id: 'LitoMore',
	include_rts: false
}, async (error, twitters) => {
	if (error) {
		console.log('error', error);
	} else {
		const thisLatest = latest;
		for (const tweet of twitters.slice().reverse()) {
			if (!/Nintendo Switch Share/.test(tweet.source)) {
				continue;
			}

			const timestamp = (new Date(tweet.created_at)).getTime() / 1000;
			latest = timestamp;

			if (timestamp > thisLatest && Array.isArray(tweet.entities.media) && tweet.entities.media.length > 0) {
				const [{media_url: mediaUrl}] = tweet.entities.media;
				const basename = path.basename(mediaUrl);
				const filepath = path.join(downpath, basename);
				downloadTasks.push(down(mediaUrl, downpath));
				postTasks.push(f.upload('/photos/upload', {photo: fs.createReadStream(filepath), status: tweet.text}));
			}
		}

		await Promise.all(downloadTasks);
		await Promise.all(postTasks);
	}
});
