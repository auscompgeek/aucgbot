// -*- Mode: JavaScript; tab-width: 4 -*- vim:tabstop=4 syntax=javascript:
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */
// Module: Transform text.

module.version = 1.5;
module.alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
module.alphaLC = "abcdefghijklmnopqrstuvwxyz";

module.cmd_tr =
function cmd_tr(dest, msg, nick, host, at, serv, relay) {
	const args = /^"(\"?[^"]+(?:\"[^"]*)*)" "(\"?[^"]+(?:\"[^"]*)*)" "(\"?[^"]+(?:\"[^"]*)*)"$/.exec(msg);
	if (!args)
		aucgbot.msg(serv, dest, at + 'Usage: tr "<text>" "<trFromTable>" "<trToTable>"');
	else
		aucgbot.msg(serv, dest, at + tr.apply(null, args));
	return true;
}
module.cmd_rot13 =
function cmd_rot13(dest, msg, nick, host, at, serv, relay) {
	aucgbot.msg(serv, dest, at + tr(msg, this.alphabet + this.alphaLC, "NOPQRSTUVWXYZABCDEFGHIJKLMnopqrstuvwxyzabcdefghijklm"));
	return true;
}
module.cmd_rot47 =
function cmd_rot47(dest, msg, nick, host, at, serv, relay) {
	aucgbot.msg(serv, dest, at + tr(msg, "!\"#$%&\'()*+,-./0123456789:;<=>?@" + this.alphabet + "[\\]^_`" + this.alphaLC + "{|}~", "PQRSTUVWXYZ[\\]^_`" + this.alphaLC + "{|}~!\"#$%&\'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNO"));
	return true;
}
module.cmd_revtr =
function cmd_revtr(dest, msg, nick, host, at, serv, relay) {
	aucgbot.msg(serv, dest, at + tr(msg, this.alphabet + this.alphaLC, this.alphaRev + this.alphaRev.toLowerCase()));
	return true;
}
module.cmd_rev =
function cmd_rev(dest, msg, nick, host, at, serv, relay) {
	aucgbot.msg(serv, dest, at + msg.reverse());
	return true;
}
module.cmd_encode =
function cmd_encode(dest, msg, nick, host, at, serv, relay) {
	var encoding = msg.split(" ")[0], msg = msg.split(" ").slice(1).join(" ");
	switch (encoding) {
	case "base64":
	case "b64":
		aucgbot.msg(serv, dest, at + encodeB64(msg));
		return true;
	case "html":
		aucgbot.msg(serv, dest, at + encodeHTML(msg));
		return true;
	case "url":
		aucgbot.msg(serv, dest, at + encodeURL(msg));
		return true;
	case "rot13":
		return this.cmd_rot13.apply(this, arguments);
	case "rot47":
		return this.cmd_rot47.apply(this, arguments);
	case "revtr":
		return this.cmd_revtr.apply(this, arguments);
	case "rev":
		return this.cmd_rev.apply(this, arguments);
	}
}
module.cmd_decode =
function cmd_decode(dest, msg, nick, host, at, serv, relay) {
	var encoding = msg.split(" ")[0], msg = msg.split(" ").slice(1).join(" ");
	switch (encoding) {
	case "base64":
	case "b64":
		aucgbot.msg(serv, dest, at + decodeB64(msg));
		return true;
	case "html":
		aucgbot.msg(serv, dest, at + decodeHTML(msg));
		return true;
	case "url":
		aucgbot.msg(serv, dest, at + decodeURL(msg));
		return true;
	case "rot13":
		return this.cmd_rot13.apply(this, arguments);
	case "rot47":
		return this.cmd_rot47.apply(this, arguments);
	case "revtr":
		return this.cmd_revtr.apply(this, arguments);
	case "rev":
		return this.cmd_rev.apply(this, arguments);
	}
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
module.alphaRev = module.alphabet.reverse();

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