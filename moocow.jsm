// -*- Mode: JavaScript; tab-width: 4 -*- vim:tabstop=4 syntax=javascript:
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
/*jshint es5: true, esnext: true, expr: true */
/*global module.exports: false */

module.exports.version = "0.11.1 (2013-12-21)";
module.exports.res = [
	"Mooooooooooo!", "MOO!", "Moo.", "Moo. Moo.", "Moo Moo Moo, Moo Moo.", "fish go m00!",
	"\x01ACTION nibbles on some grass\x01",
	"\x01ACTION goes and gets a drink\x01",
	"\x01ACTION looks in the $dest fridge\x01",
	//"\x01ACTION quietly meditates on the purpose of $dest\x01",
	"\x01ACTION races across the channel\x01",
	"\x01ACTION runs around in circles and falls over\x01",
	"\x01ACTION wanders aimlessly\x01",
	"\x01ACTION eyes $nick menacingly\x01",
	"\x01ACTION sniffs $nick\x01",
	"\x01ACTION thumps $nick\x01",
	"\x01ACTION solves partial differential equations\x01"
];
/**
 * Parse an action (/me ...).
 *
 * @param {string} msg The action message.
 * @param {string} nick Nick that sent the action.
 * @param {string} dest Channel or nick to send messages back.
 * @param {Stream} conn Server connection.
 * @param {string} [relay] If sent by a relay bot, the relay bot's nick.
 * @returns {boolean} true if the bot should stop processing the action.
 */
module.exports.onAction = function onAction(e) {
	if (!e.msg.match("(hit|kick|slap|eat|prod|stab|kill|whack|insult|teabag|(punch|bash|touch|pok)e)s " + e.conn.nick.replace(/\W/g, "\\$&") + "\\b", "i"))
		return false;
	function me(msg) { return "\x01ACTION " + msg + "\x01"; }
	var res = this.res;
	if (aucgbot.modules.meanie)
		res = res.concat(aucgbot.modules.meanie.slaps);
	e.send(res.random().replace("$dest", e.dest, "g").replace("$nick", e.nick, "g"));
	return true;
};
/**
 * Parse a PRIVMSG not directed at us.
 *
 * @param {string} dest Channel or nick to send messages back.
 * @param {string} msg The message.
 * @param {string} nick Nick that sent the PRIVMSG.
 * @param {string} ident User's ident.
 * @param {string} host Hostname that sent the PRIVMSG.
 * @param {Stream} conn Server connection.
 * @param {string} relay If sent by a relay bot, the relay bot's nick, else "".
 */
module.exports.onUnknownMsg = function onUnknownMsg(e) {
	var nick = e.nick, msg = e.msg;
	if (/(ham|cheese) ?burger|big mac|beef/i.test(msg) && !/^au/.test(nick))
		e.send("\x01ACTION eats", nick + "\x01");
	else if (/\bmoo|cow/i.test(msg))
		e.send(this.res.random().replace("$dest", e.dest, "g").replace("$nick", nick, "g"));
};
