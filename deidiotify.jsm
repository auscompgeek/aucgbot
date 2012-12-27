// -*- Mode: JavaScript; tab-width: 4 -*- vim:tabstop=4 syntax=javascript:
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

module.version = "0.6 (22 Dec 2012)";
module.prefs = {
	"help!": true,
	"ciao": true,
	"!list": true,
	"!kick": true,
	"!ban": true,
	"!kb": true
};
module.onMsg = function onMsg(dest, msg, nick, ident, host, conn) {
	if (this.prefs["help!"] && /^help!?$/i.test(msg)) {
		conn.reply(dest, nick, "Welcome! To get help, please state your problem. Being specific will get you help faster.");
		return true;
	}
	msg = msg.split(" ");
	switch (msg[0]) {
	case "ciao":
		if (this.prefs["ciao"] && msg.length == 1) {
			conn.send("NOTICE", nick, ":Welcome. Please note we do not support warez around here, as this is an free, open-source software network.");
			return true;
		}
		break;
	case "!list":
		if (this.prefs["!list"] && msg.length == 1) {
			conn.send("KICK", dest, nick, ":No warez for you!");
			return true;
		}
		break;
	case "!kick": case "!k":
		if (this.prefs["!kick"] && (!msg[1] || msg[1] == nick)) {
			conn.send("KICK", dest, nick, ":you asked for it");
			return true;
		}
		break;
	case "!ban": case "!b":
		if (this.prefs["!ban"] && (!msg[1] || msg[1] == nick) && !(aucgbot.prefs["nokick.nicks"].test(nick) || aucgbot.prefs["nokick.hosts"].test(host))) {
			conn.send("MODE", dest, "+b", "*!*@" + host);
			return true;
		}
		break;
	case "!kick-ban": case "!kickban": case "!kb":
		if (this.prefs["!kb"] && (!msg[1] || msg[1] == nick) && !(aucgbot.prefs["nokick.nicks"].test(nick) || aucgbot.prefs["nokick.hosts"].test(host))) {
			conn.send("KICK", dest, nick, ":you asked for it");
			conn.send("MODE", dest, "+b", "*!*@" + host);
			return true;
		}
		break;
	}
};
