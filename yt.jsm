// -*- Mode: JavaScript; tab-width: 4 -*- vim:tabstop=4 syntax=javascript:
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
/*jshint es5: true, esnext: true, expr: true */
/*global Stream: false, aucgbot: false, module: false, system: false */

module.version = 1.5;

module.cmd_yt = module.cmd_youtube =
function cmd_yt(dest, msg, nick, ident, host, conn, relay) {
	if (!/^(?:(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|(?:v|embed)\/)|youtu\.be\/))?([\w\-]+)(?:[?&#].*)?$/i.test(msg)) {
		conn.reply(dest, nick, "Get info about a YouTube video. Usage: yt <link|id>");
		return true;
	}
	var id = RegExp.$1, data, stream = new Stream("http://gdata.youtube.com/feeds/api/videos/" + id + "?v=2&alt=jsonc", null,
		{"User-Agent": aucgbot.useragent + " mod_yt/" + this.version});
	try {
		data = JSON.parse(decodeUTF8(stream.readFile())).data;
	} catch (ex) {}
	stream.close();
	if (!data) {
		conn.reply(dest, nick, "YouTube returned no data.");
		return true;
	}
	var res = [data.title, data.uploader];

	{
		let dura = data.duration,
			f = function(n) n < 10 ? "0" + n : n,
			m = f(Math.floor((dura % 3600) / 60)),
			s = f(dura % 60),
			h = Math.floor(dura / 3600);
		res.push((h ? h + ":" : "") + m + ":" + s);
	}

	if (data.rating)
		res.push(data.rating.toFixed(2) + "/5 (" + data.likeCount + "+ " + (data.ratingCount - data.likeCount) + "-)");

	res.push(data.viewCount + " views");

	if (data.commentCount)
		res.push(data.commentCount + " comments");

	res.push(data.category);

	if (id == msg)
		res.push("https://youtu.be/" + id);

	conn.reply(dest, nick, res.join(" - "));
	return true;
};
