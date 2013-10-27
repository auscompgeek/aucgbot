// -*- Mode: JavaScript; tab-width: 4 -*- vim:tabstop=4 syntax=javascript:
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
/*global module: false */

module.version = 0.5;

module.cmd_now = function cmd_now(e) {
	var dest = e.dest, args = e.args, nick = e.nick, conn = e.conn;
	if (args) {
		switch (args.toLowerCase()) {
		case "iso":
			conn.reply(dest, nick, new Date().toISOString());
			break;
		case "epoch":
			conn.reply(dest, nick, Date.now());
			break;
		case "date":
			conn.reply(dest, nick, new Date().toDateString());
			break;
		case "time":
			conn.reply(dest, nick, new Date().toTimeString());
			break;
		case "utc":
			conn.reply(dest, nick, new Date().toUTCString());
			break;
		default:
			if (args.contains("%"))  // strftime() format string
				conn.reply(dest, nick, new Date().toLocaleFormat(args));
			else
				conn.reply(dest, nick, this.cmd_now.help);
		}
	} else {
		conn.reply(dest, nick, Date());
	}
	return true;
};
module.cmd_now.help = "Convert current time to one of ISO, date, time, UTC or format strings or epoch time (ms).";

module.cmd_epoch = function cmd_epoch(e) {
	var dest = e.dest, args = e.args, nick = e.nick, conn = e.conn;
	if (!args) {
		conn.reply(dest, nick, this.cmd_epoch.help);
		return true;
	}
	args = args.split(" ");
	var date = new Date(parseInt(args.shift()));
	args = args.join(" ");
	if (args) {
		switch (args.toLowerCase()) {
		case "iso":
			conn.reply(dest, nick, date.toISOString());
			break;
		case "date":
			conn.reply(dest, nick, date.toDateString());
			break;
		case "time":
			conn.reply(dest, nick, date.toTimeString());
			break;
		case "utc":
			conn.reply(dest, nick, date.toUTCString());
			break;
		default:
			if (args.contains("%"))  // strftime() format string
				conn.reply(dest, nick, date.toLocaleFormat(args));
			else
				conn.reply(dest, nick, module.cmd_epoch.help);
		}
	} else {
		conn.reply(dest, nick, date);
	}
	return true;
};
module.cmd_epoch.help = "Convert epoch time (milliseconds) to human-readable format. Usage: epoch time [format]";
