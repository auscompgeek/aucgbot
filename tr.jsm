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

module.version = 1;
const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

module.cmd_tr =
function cmd_tr(dest, msg, nick, host, at, serv, relay)
{	const args = /^"(\"?[^"]+(?:\"[^"]*)*)" "(\"?[^"]+(?:\"[^"]*)*)" "(\"?[^"]+(?:\"[^"]*)*)"$/.exec(msg);
	if (!args)
		aucgbot.msg(dest, at + 'Invalid usage. Usage: tr "<text>" "<trFromTable>" "<trToTable>"');
	else
		aucgbot.msg(dest, at + tr.apply(null, args));
	return true;
}
module.cmd_rot13 =
function cmd_rot13(dest, msg, nick, host, at, serv, relay)
{	aucgbot.msg(dest, at + tr(msg, alphabet + alphabet.toLowerCase(), "NOPQRSTUVWXYZABCDEFGHIJKLMnopqrstuvwxyzabcdefghijklm"));
	return true;
}
module.cmd_revtr =
function cmd_revtr(dest, msg, nick, host, at, serv, relay)
{	const reverseABC = alphabet.reverse();
	aucgbot.msg(dest, at + tr(msg, alphabet + alphabet.toLowerCase(), reverseABC + reverseABC.toLowerCase()));
	return true;
}
module.cmd_rev =
function cmd_rev(dest, msg, nick, host, at, serv, relay)
{	aucgbot.msg(dest, at + msg.reverse());
	return true;
}

// based on http://www.svendtofte.com/code/usefull_prototypes/
// and I guess stolen from https://developer.mozilla.org/en/A_re-introduction_to_JavaScript
String.prototype.reverse =
function reverse()
{	var s = "";
	for (var i = this.length - 1; i >= 0; i--)
	    s += this[i];
	return s;
}

function tr(str, fromTable, toTable)
{	var s = "";
	for (var i = 0; i < str.length; i++)
		s += toTable[fromTable.indexOf(str[i])];
	return s;
}