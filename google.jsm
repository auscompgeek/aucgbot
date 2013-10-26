// -*- Mode: JavaScript; tab-width: 4 -*- vim:tabstop=4 syntax=javascript:
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
/*global Stream: false, aucgbot: false, module: false */

module.version = 1.1;

module.cmd_g = module.cmd_google =
function cmd_google(dest, msg, nick, ident, host, conn, relay) {
	var dest = e.dest, args = e.args, nick = e.nick, conn = e.conn;
	if (!args) {
		conn.reply(dest, nick, "Search Google. Usage: g <query>");
		return true;
	}

	var data;
	try {
		data = aucgbot.getJSON("http://ajax.googleapis.com/ajax/services/search/web?v=1.0&rsz=1&q=" + encodeURIComponent(args), "google", this.version);
	} catch (ex) {}

	if (!data) {
		conn.reply(dest, nick, "Google returned no data.");
		return true;
	}
	if (data.responseStatus != 200) {
		conn.reply(dest, nick, data.responseStatus, data.responseDetails);
		return true;
	}

	var res0 = data.responseData.results[0];
	conn.reply(dest, nick, res0 ? (
			unescape(res0.url) + " - " + decodeHTML(res0.titleNoFormatting) + " - " +
			decodeHTML(res0.content).replace(/<\/?b>/g, "\002").replace(/\s+/g, " ")
		) : "No results.");
	return true;
};
