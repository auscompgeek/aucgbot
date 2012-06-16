// -*- Mode: JavaScript; tab-width: 4 -*- vim:tabstop=4 syntax=javascript:
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */
 
module.version = "0.4 (16 Jun 2012)";
module.onMsg =
function onMsg(dest, msg, nick, host, at, serv)
{	var msg = msg.split(" ");
	switch (msg[0])
	{	case "ciao":
			aucgbot.send(serv, "NOTICE", nick, ":Welcome. Please note we do not support warez around here, as this is an free, open-source software network.");
			return true;
		case "!list":
			aucgbot.send(serv, "KICK", dest, nick, ":No warez for you!");
			return true;
		case "!kick":
		case "!k":
			if (!msg[1] || msg[1] == nick) aucgbot.send(serv, "KICK", dest, nick, ":you asked for it");
			return true;
		case "!ban":
		case "!b":
			if ((!msg[1] || msg[1] == nick) && !(aucgbot.prefs["nokick.nicks"].test(nick) || aucgbot.prefs["nokick.hosts"].test(host)))
				aucgbot.send(serv, "MODE", dest, "+b", "*!*@" + host);
			return true;
		case "!kick-ban":
		case "!kickban":
		case "!kb":
			if ((!msg[1] || msg[1] == nick) && !(aucgbot.prefs["nokick.nicks"].test(nick) || aucgbot.prefs["nokick.hosts"].test(host)))
			{	aucgbot.send(serv, "KICK", dest, nick, ":you asked for it");
				aucgbot.send(serv, "MODE", dest, "+b", "*!*@" + host);
			}
			return true;
	}
}