// -*- Mode: JavaScript; tab-width: 4 -*- vim:tabstop=4 syntax=javascript:
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
/*global aucgbot: false, module.exports: false, randint: false */

module.exports.version = 0.4;

module.exports.getXKCDInfo = function getXKCDInfo(num) {
	num = num | 0;
	return JSON.parse(aucgbot.getHTTP("http://xkcd.com/" + (num ? num + "/" : "") + "info.0.json"));
};

module.exports.cmd_randxkcd = function cmd_randxkcd(e) {
	var dest = e.dest, num = e.args | 0, nick = e.nick, conn = e.conn;

	try {
		num = this.getXKCDInfo().num;
	} catch (ex) {}

	if (!num) {
		num = ((new Date()).getFullYear() / 2) | 0;
	}

	conn.reply(dest, nick, "https://xkcd.com/" + randint(1, num) + "/");
	return true;
};

module.exports.cmd_xkcd = function cmd_xkcd(e) {
	var dest = e.dest, args = e.args, nick = e.nick, conn = e.conn, info;
	try {
		info = this.getXKCDInfo(args);
	} catch (ex) {}

	if (!info) {
		conn.reply(dest, nick, "xkcd didn't return any info.");
		return true;
	}

	conn.reply(
		dest, nick,
		"{0}-{1}-{2}".format(info.year, info.month, info.day), "-",
		info.safe_title, "-",
		"https://xkcd.com/" + info.num + "/"
	);
	return true;
};
