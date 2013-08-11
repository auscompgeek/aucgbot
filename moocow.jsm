// -*- Mode: JavaScript; tab-width: 4 -*- vim:tabstop=4 syntax=javascript:
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
/*jshint expr: true */
/*global module: false */

module.version = "0.7.1 (2 Jan 2013)";
module.res = [
	"Mooooooooooo!", "MOO!", "Moo.", "Moo. Moo.", "Moo Moo Moo, Moo Moo.", "fish go m00!",
	"\x01ACTION nibbles on some grass\x01",
	"\x01ACTION goes and gets a drink\x01",
	"\x01ACTION looks in the $dest fridge\x01",
	"\x01ACTION quietly meditates on the purpose of $dest\x01",
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
module.onAction = function onAction(msg, nick, dest, conn, relay) {
	if (!msg.match("(hit|kick|slap|eat|prod|stab|kill|whack|insult|teabag|(punch|bash|touch|pok)e)s " + conn.nick.replace(/\W/g, "\\$&") + "\\b", "i"))
		return false;
	function me(msg) "\x01ACTION " + msg + "\x01";
	var res = [
		me("slaps $nick around a bit with a large trout"),
		me("slaps $nick around a bit with a small fish"),
		"$nick! Look over there! *slap*",
		me("gets the battering hammer and bashes $nick with it"),
		me("bashes $nick with a terrifying Windows ME user guide"),
		me("beats $nick to a pulp"),
		me("whams $nick into auscompgeek's Nokia"),
		me("hits $nick with an enormous Compaq laptop"),
		me("hits $nick with auscompgeek's Lenovo Edge 11 (NSW-DER edition)"),
		me("hits $nick with a breath taking Windows ME user guide"),
		me("smacks $nick"),
		me("trips up $nick and laughs"),
		me("uses his 1337ness against $nick"),
		//me("slaps $nick, therefore adding to his aggressiveness stats"),
		me("pokes $nick in the ribs"),
		me("drops a fully grown whale on $nick"),
		me("whacks $nick with a piece of someone's floorboard"),
		me("slaps $nick with IE6"),
		me("trout slaps $nick"),
		me("hits $nick over the head with a hammer"),
		me("slaps $nick"),
		me("slaps $nick with a trout"),
		me("whacks $nick with a suspicious brick"),
		me("puts $nick's fingers in a Chinese finger lock"),
		me("randomly slaps $nick"),
		me("pies $nick"),
		"Hey! Stop it!", "Go away!", "GETOFF!"
	].concat(this.res);
	conn.msg(dest, res.random().replace("$dest", dest, "g").replace("$nick", nick, "g"));
	return true;
};
/**
 * Parse a PRIVMSG.
 *
 * @param {string} dest Channel or nick to send messages back.
 * @param {string} msg The message.
 * @param {string} nick Nick that sent the PRIVMSG.
 * @param {string} ident User's ident.
 * @param {string} host Hostname that sent the PRIVMSG.
 * @param {Stream} conn Server connection.
 * @param {string} relay If sent by a relay bot, the relay bot's nick, else "".
 */
module.onMsg = function onMsg(dest, msg, nick, ident, host, conn, relay) {
	if (/(ham|cheese) ?burger|beef/i.test(msg) && !/^au/.test(nick))
		conn.msg(dest, "\x01ACTION eats", nick + "\x01");
	else if (/moo|cow/i.test(msg))
		conn.msg(dest, this.res.random().replace("$dest", dest, "g").replace("$nick", nick, "g"));
};
