// -*- Mode: JavaScript; tab-width: 4 -*- vim:tabstop=4 syntax=javascript:
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

module.version = 0.1;

module.cmd_yt = module.cmd_youtube =
function cmd_yt(dest, msg, nick, ident, host, conn, relay) {
	var id = encodeURL(msg).replace(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|v\/)|youtu\.be\/)([\w-]+)(?:[?&#].*)?/i, "$1");
	if (!id) {
		conn.reply(dest, nick, "Get info about a YouTube video. Usage: yt <link|id>");
		return true;
	}
	var stream = new Stream("http://gdata.youtube.com/feeds/api/videos/" + id + "?v=2&alt=json", null, {"User-Agent": "aucgbot/" + aucgbot.version + " (" + system.platform + "; JSDB " + system.release + "; JavaScript " + system.version / 10 + ") mod_yt/" + this.version});
	try {
		var data = JSON.parse(stream.readFile()).entry;
	} catch (ex) {}
	stream.close();
	if (!data) {
		conn.reply(dest, nick, "No data found.");
		return true;
	}
	var response = [data.title["$t"]];

	var authors = [];
	for (let i = 0, author; author = data.author[i]; i++)
		authors.push(author.name["$t"]);
	response.push(authors.join(", "));

	var dura = data["media$group"]["yt$duration"].seconds;
	var m = f(Math.floor((dura % 3600) / 60));
	var s = f(dura % 60);
	var h = Math.floor(dura / 3600);
	response.push((h ? h + ":" : "") + m + ":" + s);

	response.push(+data['gd$rating'].average.toFixed(2) + "/5");

	response.push(data["yt$statistics"].viewCount + " views");
	response.push("+" + data["yt$rating"].numLikes + " -" + data["yt$rating"].numDislikes);

	var categories = [];
	for (let i = 0, cats = data["media$group"]["media$category"], cat; cat = cats[i]; i++)
		categories.push(cat.label);
	if (categories.length) response.push(categories.join("/"));

	if (id == msg) response.push("https://youtu.be/" + id)

	conn.reply(dest, nick, response.join(" - "));
	return true;

	function f(n) n < 10 ? "0" + n : n;
}
