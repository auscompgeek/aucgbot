// -*- Mode: JavaScript; tab-width: 4 -*- vim:tabstop=4 syntax=javascript:
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
/*global module: false */

module.version = 0.7;

module.cmd_now = function cmd_now(e) {
	var args = e.args;
	if (args) {
		switch (args.toLowerCase()) {
		case "iso":
			e.reply(new Date().toISOString());
			break;
		case "epoch":
			e.reply(Date.now());
			break;
		case "date":
			e.reply(new Date().toDateString());
			break;
		case "time":
			e.reply(new Date().toTimeString());
			break;
		case "utc":
			e.reply(new Date().toUTCString());
			break;
		default:
			if (args.contains("%"))  // strftime() format string
				e.reply(new Date().toLocaleFormat(args));
			else
				e.reply(this.cmd_now.help);
		}
	} else {
		e.reply(Date());
	}
	return true;
};
module.cmd_now.help = "Convert current time to one of ISO, date, time, UTC or format strings or epoch time (ms).";

module.cmd_epoch = function cmd_epoch(e) {
	var args = e.args;
	if (!args) {
		e.reply(this.cmd_epoch.help);
		return true;
	}
	args = args.split(" ");
	var date = new Date(parseInt(args.shift()));
	args = args.join(" ");
	if (args) {
		switch (args.toLowerCase()) {
		case "iso":
			e.reply(date.toISOString());
			break;
		case "date":
			e.reply(date.toDateString());
			break;
		case "time":
			e.reply(date.toTimeString());
			break;
		case "utc":
			e.reply(date.toUTCString());
			break;
		default:
			if (args.contains("%"))  // strftime() format string
				e.reply(date.toLocaleFormat(args));
			else
				e.reply(this.cmd_epoch.help);
		}
	} else {
		e.reply(date);
	}
	return true;
};
module.cmd_epoch.help = "Convert epoch time (milliseconds) to human-readable format. Usage: epoch time [format]";

module.cmd_tz = function cmd_tz(e) {
	var args = e.args;
	if (!/^[\w+\-]+(?:\/\w+)?$/.test(args)) {
		e.reply(this.cmd_tz.help);
		return true;
	}
	e.reply(e.bot.readURI("exec://TZ={0} date".format(args)));
	return true;
};
module.cmd_tz.help = "Get the date in another timezone. Timezones are valid TZ strings, e.g. Australia/NSW.";
