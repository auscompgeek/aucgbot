// -*- Mode: JavaScript; tab-width: 4 -*- vim:tabstop=4 syntax=javascript:
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
 
// Load this by sending the bot: rc loadmod helloworld

module.version = "0.5 (1 Oct 2012)";
// Do NOT do this! Use onMsg() or cmd_*() instead so that the flood protection is triggered.
/*module.parseln =
function parseln(ln, conn) {
	if ((lnary = /^:(\S+)!(\S+)@(\S+) PRIVMSG (\S+) :(.*)/.exec(ln))) {
		lnary.shift();
		var at = "", dest = lnary[0];
		if (/^[#&+!]/.test(lnary[3])) at = lnary[0] + ": ", dest = lnary[3];
		if (lnary[4].match(aucgbot.nick.replace(/\W/g, "\\$&") + ": hello")) {
			conn.msg(dest, "Hello world!");
			return true; // Stop processing of message.
		}
	}
}
*/
/**
 * Parse a PRIVMSG.
 *
 * @param {string} dest Channel or nick to send messages back
 * @param {string} msg The message
 * @param {string} nick Nick that sent the PRIVMSG
 * @param {string} host Hostname that sent the PRIVMSG
 * @param {string} at Contains "nick: " if sent to a channel, else ""
 * @param {Stream} conn Server connection
 * @param {string} relay If sent by a relay bot, the relay bot's nick, else "".
 */
module.onMsg =
function onMsg(dest, msg, nick, ident, host, conn, relay) {
	if (msg.match("hello bot")) {
		conn.msg(dest, "Hello World!");
		return true; // Stop processing of message.
	}
}
module.cmd_hello =
function cmd_hello(dest, msg, nick, ident, host, conn, relay) {
	conn.reply(dest, nick, "Hello World!");
	return true; // Say that we've reached a valid command and stop processing the message.
}