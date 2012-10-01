// -*- Mode: JavaScript; tab-width: 4 -*- vim:tabstop=4 syntax=javascript:
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

module.version = "0.6 (1 Oct 2012)";
module.res = [
	"Mooooooooooo!", "MOO!", "Moo.", "Moo. Moo.", "Moo Moo Moo, Moo Moo.", "fish go m00!",
	"\1ACTION nibbles on some grass\1",
	"\1ACTION goes and gets a drink\1",
	"\1ACTION looks in the $dest fridge\1",
	"\1ACTION quietly meditates on the purpose of $dest\1",
	"\1ACTION races across the channel\1",
	"\1ACTION runs around in circles and falls over\1",
	"\1ACTION wanders aimlessly\1",
	"\1ACTION eyes $nick menacingly\1",
	"\1ACTION sniffs $nick\1",
	"\1ACTION thumps $nick\1",
	"\1ACTION solves partial differential equations\1"
];
module.onCTCP =
function onCTCP(type, msg, nick, dest, conn) {
	if (type == "ACTION")
		var res = [
			"\1ACTION slaps $nick around a bit with a large trout\1",
			"\1ACTION slaps $nick around a bit with a small fish\1",
			"$nick! Look over there! *slap*",
			"\1ACTION gets the battering hammer and bashes $nick with it\1",
			"\1ACTION bashes $nick with a terrifying Windows ME user guide\1",
			"\1ACTION beats $nick to a pulp\1",
			"\1ACTION hits $nick with an enormous Compaq laptop\1",
			"\1ACTION hits $nick with a breath taking Windows ME user guide\1",
			"\1ACTION smacks $nick\1",
			"\1ACTION trips up $nick and laughs\1",
			"\1ACTION uses his 1337ness against $nick\1",
			"\1ACTION slaps $nick, therefore adding to his aggressiveness stats\1",
			"\1ACTION pokes $nick in the ribs\1",
			"\1ACTION drops a fully grown whale on $nick\1",
			"\1ACTION whacks $nick with a piece of someone's floorboard\1",
			"\1ACTION slaps $nick with IE6\1",
			"\1ACTION trout slaps $nick\1",
			"\1ACTION hits $nick over the head with a hammer\1",
			"\1ACTION slaps $nick\1",
			"\1ACTION slaps $nick with a trout\1",
			"\1ACTION whacks $nick with a suspicious brick\1",
			"\1ACTION puts $nick's fingers in a Chinese finger lock\1",
			"\1ACTION randomly slaps $nick\1",
			"\1ACTION pies $nick\1",
			"Hey! Stop it!", "Go away!", "GETOFF!",
		].concat(this.res);
		msg.match("(hit|kick|slap|eat|prod|stab|kill|whack|insult|teabag|(punch|bash|touch|pok)e)s " +
			conn.nick.replace(/\W/g, "\\$&") + "\\b", "i") &&
			conn.msg(dest, res.random().replace("$dest", dest, "g").replace("$nick", nick, "g"));
}
module.onMsg =
function onMsg(dest, msg, nick, ident, host, conn, relay) {
	if (/(ham|cheese) ?burger|beef/i.test(msg) && !/^au/.test(nick))
		conn.msg(dest, "\1ACTION eats", nick + "\1");
	else if (/moo|cow/i.test(msg)) {
		conn.msg(dest, this.res.random().replace("$dest", dest, "g").replace("$nick", nick, "g"));
	}
}