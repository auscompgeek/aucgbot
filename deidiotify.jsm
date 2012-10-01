// -*- Mode: JavaScript; tab-width: 4 -*- vim:tabstop=4 syntax=javascript:
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */
 
module.version = "0.5 (12 Aug 2012)";
module.onMsg =
function onMsg(dest, msg, nick, ident, host, conn) {
	if (/^help!?$/i.test(msg))
		conn.reply(dest, nick, "Welcome! To get help, please state your problem. Being specific will get you help faster.");
	var msg = msg.split(" ");
	switch (msg[0]) {
	case "ciao":
		conn.send("NOTICE", nick, ":Welcome. Please note we do not support warez around here, as this is an free, open-source software network.");
		return true;
	case "!list":
		conn.send("KICK", dest, nick, ":No warez for you!");
		return true;
	case "!kick":
	case "!k":
		if (!msg[1] || msg[1] == nick) conn.send("KICK", dest, nick, ":you asked for it");
		return true;
	case "!ban":
	case "!b":
		if ((!msg[1] || msg[1] == nick) && !(aucgbot.prefs["nokick.nicks"].test(nick) || aucgbot.prefs["nokick.hosts"].test(host)))
			conn.send("MODE", dest, "+b", "*!*@" + host);
		return true;
	case "!kick-ban":
	case "!kickban":
	case "!kb":
		if ((!msg[1] || msg[1] == nick) && !(aucgbot.prefs["nokick.nicks"].test(nick) || aucgbot.prefs["nokick.hosts"].test(host)))
		{	conn.send("KICK", dest, nick, ":you asked for it");
			conn.send("MODE", dest, "+b", "*!*@" + host);
		}
		return true;
	}
}