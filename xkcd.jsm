// -*- Mode: JavaScript; tab-width: 4 -*- vim:tabstop=4 syntax=javascript:
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
/*global aucgbot: false, module: false, randint: false */

module.version = 0.4;

module.getXKCDInfo = function getXKCDInfo(num) {
	num = num >>> 0;
	return JSON.parse(aucgbot.readURI("http://xkcd.com/" + (num ? num + "/" : "") + "info.0.json"));
}

module.cmd_randxkcd = function cmd_randxkcd(e) {
	var num = e.args | 0;

	try {
		num = this.getXKCDInfo().num;
	} catch (ex) {}

	if (!num) {
		num = ((new Date()).getFullYear() / 2) | 0;
	}

	e.reply("https://xkcd.com/" + randint(1, num) + "/");
	return true;
};

module.cmd_xkcd = function cmd_xkcd(e) {
	var args = e.args, info;
	try {
		info = this.getXKCDInfo(args);
	} catch (ex) {}

	if (!info) {
		e.reply("xkcd didn't return any info.");
		return true;
	}

	e.reply(
		"{0}-{1}-{2}".format(info.year, info.month, info.day), "-",
		info.safe_title, "-",
		"https://xkcd.com/" + info.num + "/"
	);
	return true;
};
