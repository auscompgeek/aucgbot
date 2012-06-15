// -*- Mode: JavaScript; tab-width: 4 -*- vim:tabstop=4 syntax=javascript:
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */
// Module: Transform text.

module.version = 1.4;
module.alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
module.alphaLC = "abcdefghijklmnopqrstuvwxyz";

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
{	aucgbot.msg(dest, at + tr(msg, this.alphabet + this.alphaLC, "NOPQRSTUVWXYZABCDEFGHIJKLMnopqrstuvwxyzabcdefghijklm"));
	return true;
}
module.cmd_rot47 =
function cmd_rot47(dest, msg, nick, host, at, serv, relay)
{	aucgbot.msg(dest, at + tr(msg, "!\"#$%&\'()*+,-./0123456789:;<=>?@" + this.alphabet + "[\\]^_`" + this.alphaLC + "{|}~", "PQRSTUVWXYZ[\\]^_`" + this.alphaLC + "{|}~!\"#$%&\'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNO"));
	return true;
}
module.cmd_revtr =
function cmd_revtr(dest, msg, nick, host, at, serv, relay)
{	aucgbot.msg(dest, at + tr(msg, this.alphabet + this.alphaLC, this.reverseABC + this.reverseABC.toLowerCase()));
	return true;
}
module.cmd_rev =
function cmd_rev(dest, msg, nick, host, at, serv, relay)
{	aucgbot.msg(dest, at + msg.reverse());
	return true;
}
module.cmd_b64encode =
function cmd_b64encode(dest, msg, nick, host, at, serv, relay)
{	aucgbot.msg(dest, at + encodeB64(msg));
	return true;
}
module.cmd_b64decode =
function cmd_b64decode(dest, msg, nick, host, at, serv, relay)
{	aucgbot.msg(dest, at + decodeB64(msg));
	return true;
}
module.cmd_htmlencode =
function cmd_htmlencode(dest, msg, nick, host, at, serv, relay)
{	aucgbot.msg(dest, at + encodeHTML(msg));
	return true;
}
module.cmd_htmldecode =
function cmd_htmldecode(dest, msg, nick, host, at, serv, relay)
{	aucgbot.msg(dest, at + decodeHTML(msg));
	return true;
}
module.cmd_urlencode =
function cmd_urlencode(dest, msg, nick, host, at, serv, relay)
{	aucgbot.msg(dest, at + encodeURL(msg));
	return true;
}
module.cmd_urldecode =
function cmd_urldecode(dest, msg, nick, host, at, serv, relay)
{	aucgbot.msg(dest, at + decodeURL(msg));
	return true;
}

// from http://www.svendtofte.com/code/usefull_prototypes/
// and https://developer.mozilla.org/en/A_re-introduction_to_JavaScript
String.prototype.reverse =
function reverse()
{	var s = "";
	for (var i = this.length - 1; i >= 0; i--)
	    s += this[i];
	return s;
}
module.reverseABC = module.alphabet.reverse();

function tr(str, fromTable, toTable)
{	var s = "";
	for (var i = 0, j = 0, k = ""; i < str.length; i++)
	{	if ((j = fromTable.indexOf(str[i])) == -1)
			k = str[i];
		else if (!(k = toTable[j]))
			k = "";
		s += k;
	}
	return s;
}