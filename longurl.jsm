// -*- Mode: JavaScript; tab-width: 4 -*- vim:tabstop=4 syntax=javascript:
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
/*global module.exports: false */

module.exports.version = 0.9;

module.exports.cmd_longurl = function cmd_longurl(e) {
	var url = e.args.replace(/^htt?p?(s)?:?\/\/?/i, "http$1://"); // typo correction

	if (!url) {
		e.reply(this.cmd_longurl.help);
		return true;
	}

	if (url.slice(0, 4) != "http")
		url = "http://" + url;

	if (/^(http:\/\/(?:v|is)\.gd\/)(\w+)/.test(url)) {
		// v.gd shortening service - use their lookup API as LongURL.org doesn't work
		e.reply(e.bot.getHTTP(RegExp.$1 + "forward.php?format=simple&shorturl=" + RegExp.$2));
		return true;
	}

	var data;
	try {
		data = e.bot.getJSON("http://api.longurl.org/v2/expand?content-type=1&title=1&rel-canonical=1&format=json&url=" + encodeURIComponent(url), "longurl", this.version);
	} catch (ex) {}

	if (!data) {
		e.reply("No data found.");
		return true;
	}

	if (data.messages) {
		var msg0 = data.messages[0];
		e.reply(msg0.type + ":", msg0.message);
		return true;
	}

	var res = [data["rel-canonical"] || data["long-url"], data["content-type"]];
	if (data.title)
		res.push(data.title);

	e.reply(res.join(" - "));
	return true;
};
module.exports.cmd_longurl.help = "Get the canonical long URL from LongURL.org. Usage: longurl <url>";
