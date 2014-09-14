// -*- Mode: JavaScript; tab-width: 4 -*- vim:tabstop=4 syntax=javascript:
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
/*global module.exports: false */

module.exports.version = "1.2.3 (2014-01-21)";
module.exports.prefs = {
	"fnqwebirc": true,
	"help!": true,
	"ciao": false,
	"!list": false,
	"kick": true,
	"ban": true,
	"!kb": true
};
module.exports.strings = {
	"fnqwebirc": ":[{0}] Welcome! To allow other users to identify you more easily, please change your nick (/nick newnickname). Thanks!",
	"help!": "Welcome! To get help, please state your problem. Being specific will get you help faster.",
	"ciao": "Welcome. Please note we do not support warez around here, as this is a free, open-source software network.",
	"!list": ":No warez for you!",
	"kick": ":you asked for it",
	"!kb": ":you asked for it"
};
module.exports.parseln = function parseln(ln, conn) {
	if (!(this.prefs.fnqwebirc && /^:(qwebirc\d+)![0-9a-f]+@gateway\/web\/freenode\/ip\.\d+\.\d+\.\d+\.\d+ JOIN :?(\S+)/.test(ln))) {
		return false;
	}
	conn.send("CNOTICE", RegExp.$1, RegExp.$2, this.strings.fnqwebirc.format(RegExp.$2));
	return true;
};
module.exports.onUnknownMsg = function onUnknownMsg(e) {
	var dest = e.dest, msg = e.msg, nick = e.nick, conn = e.conn;
	msg = msg.split(" ");
	var arg = msg[1];
	switch (msg[0]) {
	case "help": case "help!":
		if (this.prefs["help!"] && msg.length === 1) {
			e.reply(this.strings["help!"]);
			return true;
		}
		break;
	case "ciao":
		if (this.prefs.ciao && msg.length === 1) {
			e.notice(this.strings.ciao);
			return true;
		}
		break;
	case "!list":
		if (this.prefs["!list"] && msg.length === 1) {
			conn.send("KICK", dest, nick, this.strings["!list"]);
			return true;
		}
		break;
	case "!kick": case "!k":
		if (this.prefs.kick && (!arg || arg === nick || arg === "me")) {
			conn.send("KICK", dest, nick, this.strings.kick);
			return true;
		}
		break;
	case "!ban": case "!b":
		if (this.prefs.ban && (!arg || arg === nick || arg === "me") && e.okToKick()) {
			conn.send("MODE", dest, "+b", "*!*@" + host);
			return true;
		}
		break;
	case "!kick-ban": case "!kickban": case "!kb":
		if (this.prefs["!kb"] && (!arg || arg === nick || arg === "me") && e.okToKick()) {
			conn.send("KICK", dest, nick, this.strings["!kb"]);
			conn.send("MODE", dest, "+b", "*!*@" + host);
			return true;
		}
		break;
	}
};
