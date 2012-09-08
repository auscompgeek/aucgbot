// -*- Mode: JavaScript; tab-width: 4 -*- vim:tabstop=4 syntax=javascript:
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */
// Module: Transform text.

module.version = 1.8;
module.UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
module.LOWER = "abcdefghijklmnopqrstuvwxyz";

module.cmd_tr =
function cmd_tr(dest, msg, nick, ident, host, serv, relay) {
	const args = /^"((?:\\")*[^"]+(?:(?:\\")[^"]*)*)" "((?:\\")*[^"]+(?:(?:\\")[^"]*)*)" "((?:\\")*[^"]+(?:(?:\\")[^"]*)*)"$/.exec(msg);
	aucgbot.reply(serv, dest, nick, args ? tr.apply(null, args) : 'Usage: tr "<text>" "<trFromTable>" "<trToTable>"');
	return true;
}
module.cmd_rot13 =
function cmd_rot13(dest, msg, nick, ident, host, serv, relay) {
	const ROT13 = "NOPQRSTUVWXYZABCDEFGHIJKLM";
	aucgbot.reply(serv, dest, nick, tr(msg, this.UPPER + this.LOWER, ROT13 + ROT13.toLowerCase()));
	return true;
}
module.cmd_rot47 =
function cmd_rot47(dest, msg, nick, ident, host, serv, relay) {
	aucgbot.reply(serv, dest, nick, tr(msg, "!\"#$%&\'()*+,-./0123456789:;<=>?@" + this.UPPER + "[\\]^_`" + this.LOWER + "{|}~", "PQRSTUVWXYZ[\\]^_`" + this.LOWER + "{|}~!\"#$%&\'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNO"));
	return true;
}
module.cmd_revtr =
function cmd_revtr(dest, msg, nick, ident, host, serv, relay) {
	aucgbot.reply(serv, dest, nick, tr(msg, this.UPPER + this.LOWER, this.REVUPPER + this.REVLOWER));
	return true;
}
module.cmd_rev =
function cmd_rev(dest, msg, nick, ident, host, serv, relay) {
	aucgbot.reply(serv, dest, nick, msg.reverse());
	return true;
}
module.cmd_encode =
function cmd_encode(dest, msg, nick, ident, host, serv, relay) {
	var encoding = msg.split(" ")[0], msg = msg.split(" ").slice(1).join(" ");
	switch (encoding) {
	case "base64":
	case "b64":
		aucgbot.reply(serv, dest, nick, encodeB64(msg));
		return true;
	case "html":
		aucgbot.reply(serv, dest, nick, encodeHTML(msg));
		return true;
	case "url":
		aucgbot.reply(serv, dest, nick, encodeURL(msg));
		return true;
	case "charcode":
		var s = [], i;
		for (i = 0; i < msg.length; i++)
			s.push(msg.charCodeAt(i));
		return aucgbot.reply(serv, dest, nick, s.join(" "));
	}
}
module.cmd_decode =
function cmd_decode(dest, msg, nick, ident, host, serv, relay) {
	var encoding = msg.split(" ")[0], msg = msg.split(" ").slice(1).join(" ");
	switch (encoding) {
	case "base64":
	case "b64":
		aucgbot.reply(serv, dest, nick, decodeB64(msg));
		return true;
	case "html":
		aucgbot.reply(serv, dest, nick, decodeHTML(msg));
		return true;
	case "url":
		aucgbot.reply(serv, dest, nick, decodeURL(msg));
		return true;
	case "charcode":
		var s = "", msg = msg.split(" "), i;
		while (i = msg.shift())
			s += String.fromCharCode(i);
		return aucgbot.reply(serv, dest, nick, s);
	}
}
module.cmd_albhed =
function cmd_albhed(dest, msg, nick, ident, host, serv, relay) {
	const AL_BHED = "YPLTAVKREZGMSHUBXNCDIJFQOW";
	aucgbot.reply(serv, dest, nick, tr(msg, this.UPPER + this.LOWER, AL_BHED + AL_BHED.toLowerCase()));
	return true;
}

// from http://www.svendtofte.com/code/usefull_prototypes/
// and https://developer.mozilla.org/en/A_re-introduction_to_JavaScript
String.prototype.reverse =
function reverse() {
	var s = "";
	for (let i = this.length - 1; i >= 0; i--)
	    s += this[i];
	return s;
}
module.REVUPPER = module.UPPER.reverse();
module.REVLOWER = module.REVUPPER.toLowerCase();

function tr(str, fromTable, toTable) {
	var s = "";
	for (let i = 0, j = 0, k = ""; i < str.length; i++) {
		if ((j = fromTable.indexOf(str[i])) == -1)
			k = str[i];
		else if (!(k = toTable[j]))
			k = "";
		s += k;
	}
	return s;
}