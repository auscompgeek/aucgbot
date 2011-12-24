/* -*- Mode: JavaScript; tab-width: 4 -*- vim:tabstop=4 syntax=javascript:
 * ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is aucg's JS IRC bot.
 *
 * The Initial Developer of the Original Code is
 * Netscape Communications Corporation.
 * Portions created by the Initial Developer are Copyright (C) 1998
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   David Vo, David.Vo2@gmail.com, original author
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK *****
 */
 
// Load this by sending the bot: rc loadmod helloworld

module.version = "0.3.2 (3 Dec 2011)";
/* Do NOT do this! Use onMsg() or cmd_*() instead so that the flood protection is triggered.
module.parseln =
function parseln(ln, serv)
{	if ((lnary = /^:(\S+)!(\S+)@(\S+) PRIVMSG (\S+) :(.*)/.exec(ln)))
	{	lnary.shift();
		var at = "", dest = lnary[0];
		if (/^[#&+!]/.test(lnary[3])) at = lnary[0] + ": ", dest = lnary[3];
		if (lnary[4].match(aucgbot.nick.replace(/\W/g, "\\$&") + ": hello"))
		{	aucgbot.msg(dest, "Hello world!");
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
 * @param {string} serv Server hostname
 * @param {string} relay If sent by a relay bot, the relay bot's nick, else "".
 */
module.onMsg =
function onMsg(dest, msg, nick, host, at, serv, relay)
{	if (msg.match("hello bot"))
	{	aucgbot.msg(dest, "Hello, World!");
		return true; // Stop processing of message.
	}
}
module.cmd_hello =
function cmd_hello(dest, msg, nick, host, at, serv, relay)
{	aucgbot.msg(dest, at + "Hello, World!");
	return true; // Say that we've reached a valid command and stop processing the message.
}