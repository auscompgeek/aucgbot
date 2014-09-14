// -*- Mode: JavaScript; tab-width: 4 -*- vim:tabstop=4 syntax=javascript:
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
/*global module.exports: false */

module.exports.version = 0.3;
module.exports.users = {};

module.exports.cmd_tell = function cmd_tell(e) {
	var argv = e.args.split(" "), nick = e.nick;
	if (argv.length < 2) {
		e.reply(this.cmd_tell.help);
		return true;
	}

	var user = argv[0], name = user.toLowerCase();
	if (name === "me" || name === nick.toLowerCase()) {
		e.reply("You can tell yourself that.");
		return true;
	}
	if (name === e.conn.nick.toLowerCase()) {
		e.reply(e.bot.ERR_MSG_SELF);
		return true;
	}

	var users = this.users, date = new Date();
	if (!Object.prototype.hasOwnProperty.call(users, name)) {
		users[name] = [];
	}
	users[name].push("{0}:{1}Z <{2}> {3}".format(date.getUTCHours(), date.getUTCMinutes(), nick, e.msg));

	e.reply("I'll pass that on when", user, "is around.");
	return true;
};
module.exports.cmd_tell.help = "Send a message (through NOTICE) to someone when I see them next. Usage: tell <nick> <message>";

module.exports.onMsg = function onMsg(e) {
	var name = e.nick.toLowerCase(), users = this.users, user = users[name], line;
	if (Object.prototype.hasOwnProperty.call(users, name) && user.length) {
		while ((line = user.pop())) {
			e.notice(line);
		}
	}
};
