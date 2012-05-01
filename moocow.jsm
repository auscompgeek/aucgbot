// -*- Mode: JavaScript; tab-width: 4 -*- vim:tabstop=4 syntax=javascript:
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

module.version = "0.2.3 (29 Apr 2012)";
module.onMsg =
function onMsg(dest, msg, nick, host, at, serv)
{	if (/(ham|cheese) ?burger|beef/i.test(msg) && !/^au/.test(nick))
		aucgbot.msg(dest, "\1ACTION eats", nick + "\1");
	else if (/moo|cow/i.test(msg))
	{	var s =
		[	"Mooooooooooo!", "MOO!", "Moo.", "Moo. Moo.", "Moo Moo Moo, Moo Moo.", "fish go m00!",
			"\1ACTION nibbles on some grass\1",
			"\1ACTION goes and gets a drink\1",
			"\1ACTION looks in the " + dest + " fridge\1",
			"\1ACTION quietly meditates on the purpose of " + dest + "\1",
			"\1ACTION races across the channel\1",
			"\1ACTION runs around in circles and falls over\1",
			"\1ACTION wanders aimlessly\1",
			"\1ACTION eyes " + nick + " menacingly\1",
			"\1ACTION sniffs " + nick + "\1",
			"\1ACTION thumps " + nick + "\1",
			"\1ACTION solves partial differential equations\1"
		];
		aucgbot.msg(dest, s[ranint(0, s.length - 1)]);
	}
}