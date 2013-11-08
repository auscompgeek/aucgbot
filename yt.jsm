// -*- Mode: JavaScript; tab-width: 4 -*- vim:tabstop=4 syntax=javascript:
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
/*jshint es5: true, esnext: true, expr: true */
/*global Stream: false, aucgbot: false, module: false, system: false */

module.version = 2.6;

module.cmd_ytv = module.cmd_ytid =
function cmd_ytv(e) {
	var dest = e.dest, args = e.args, nick = e.nick, conn = e.conn;
	if (!/^(?:(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|(?:v|embed)\/)|youtu\.be\/))?([\w\-]+)(?:[?&#].*)?$/i.test(args)) {
		conn.reply(dest, nick, "Get info about a YouTube video. Usage: ytv <link|id>");
		return true;
	}

	var id = RegExp.$1, data;
	try {
		data = aucgbot.getJSON("http://gdata.youtube.com/feeds/api/videos/" + id + "?v=2&alt=jsonc", "yt", this.version).data;
	} catch (ex) {}

	if (!data) {
		conn.reply(dest, nick, "YouTube returned no data.");
		return true;
	}

	var res = this.ytRes(data);
	if (id === args)
		res.push("https://youtu.be/" + id);

	conn.reply(dest, nick, res.join(" - "));
	return true;
};

module.cmd_yt = module.cmd_youtube =
function cmd_yt(e) {
	var dest = e.dest, q = e.args, nick = e.nick, conn = e.conn;
	if (!q) {
		conn.reply(dest, nick, "Get the first result of a YouTube search.");
		return true;
	}

	var data;
	try {
		data = aucgbot.getJSON("http://gdata.youtube.com/feeds/api/videos?v=2&alt=jsonc&max-results=1&q=" + encodeURIComponent(q), "yt", this.version).data;
	} catch (ex) {}

	if (!data) {
		conn.reply(dest, nick, "YouTube returned no data.");
		return true;
	}

	if (!data.totalItems) {
		conn.reply(dest, nick, "No results.");
		return true;
	}

	var item = data.items[0], res = this.ytRes(item);
	res.push("https://youtu.be/" + item.id);

	conn.reply(dest, nick, res.join(" - "));
	return true;
};

module.ytRes = function ytRes(data) {
	var res = [data.title, data.uploader];

	{
		let dura = data.duration,
			f = function f(n) n < 10 ? "0" + n : n,
			m = f(Math.floor((dura % 3600) / 60)),
			s = f(dura % 60),
			h = Math.floor(dura / 3600);
		res.push((h ? h + ":" : "") + m + ":" + s);
	}

	var desc = data.description;
	if (desc) {
		let i = desc.indexOf("\n");
		if (i !== -1)
			desc = desc.slice(0, i);
		res.push(desc);
	}

	var rating = data.rating;
	if (rating)
		res.push("{0}/5 ({1}+ {2}-)".format(+rating.toFixed(2), data.likeCount, data.ratingCount - data.likeCount));

	res.push(data.viewCount + " views");

	var commentCount = data.commentCount;
	if (commentCount)
		res.push(commentCount + " comments");

	res.push(data.category);

	return res;
};
