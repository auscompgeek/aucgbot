// -*- Mode: JavaScript; tab-width: 4 -*- vim:tabstop=4 syntax=javascript:
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
/// @fileoverview aucgbot module: Transform text.

module.version = 2.1;
module.UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
module.LOWER = "abcdefghijklmnopqrstuvwxyz";
module.ALPHABET = module.UPPER + module.LOWER;
module.AL_BHED = "YPLTAVKREZGMSHUBXNCDIJFQOWypltavkrezgmshubxncdijfqow";

module.cmd_tr = function cmd_tr(dest, msg, nick, ident, host, conn, relay) {
	var args = /^"((?:\\")*[^"]+(?:\\"[^"]*)*)" "((?:\\")*[^"]+(?:\\"[^"]*)*)" "((?:\\")*[^"]+(?:\\"[^"]*)*)"$/.exec(msg);
	args.shift();
	conn.reply(dest, nick, args ? tr.apply(null, args) : 'Usage: tr "<text>" "<trFromTable>" "<trToTable>"');
	return true;
};
module.cmd_rot13 = function cmd_rot13(dest, msg, nick, ident, host, conn, relay) {
	conn.reply(dest, nick, tr(msg, this.ALPHABET, "NOPQRSTUVWXYZABCDEFGHIJKLMnopqrstuvwxyzabcdefghijklm"));
	return true;
};
module.cmd_rot47 = function cmd_rot47(dest, msg, nick, ident, host, conn, relay) {
	conn.reply(dest, nick, tr(msg, "!\"#$%&\'()*+,-./0123456789:;<=>?@" + this.UPPER + "[\\]^_`" + this.LOWER + "{|}~", "PQRSTUVWXYZ[\\]^_`" + this.LOWER + "{|}~!\"#$%&\'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNO"));
	return true;
};
module.cmd_revtr = function cmd_revtr(dest, msg, nick, ident, host, conn, relay) {
	conn.reply(dest, nick, tr(msg, this.ALPHABET, this.REVUPPER + this.REVLOWER));
	return true;
};
module.cmd_rev = function cmd_rev(dest, msg, nick, ident, host, conn, relay) {
	conn.reply(dest, nick, msg.reverse());
	return true;
};
module.cmd_encode = function cmd_encode(dest, msg, nick, ident, host, conn, relay) {
	var args = msg.split(" ");
	msg = args.slice(1).join(" ");
	switch (args[0].toLowerCase()) {
	case "base64": case "b64":
		conn.reply(dest, nick, encodeB64(msg));
		return true;
	case "html":
		conn.reply(dest, nick, encodeHTML(msg));
		return true;
	case "url":
		conn.reply(dest, nick, encodeURL(msg));
		return true;
	case "uri":
		conn.reply(dest, nick, encodeURI(msg));
		return true;
	case "uricomponent":
		conn.reply(dest, nick, encodeURIComponent(msg));
		return true;
	case "charcode":
		var s = [];
		for (var i = 0; i < msg.length; i++)
			s.push(msg.charCodeAt(i));
		conn.reply(dest, nick, s.join(" "));
		return true;
	case "albhed":
		conn.reply(dest, nick, tr(msg, this.ALPHABET, this.AL_BHED));
		return true;
	}
};
module.cmd_decode = function cmd_decode(dest, msg, nick, ident, host, conn, relay) {
	var args = msg.split(" ");
	msg = args.slice(1).join(" ");
	switch (args[0].toLowerCase()) {
	case "base64": case "b64":
		conn.reply(dest, nick, decodeB64(msg));
		return true;
	case "html":
		conn.reply(dest, nick, decodeHTML(msg));
		return true;
	case "url":
		conn.reply(dest, nick, decodeURL(msg));
		return true;
	case "uri":
		conn.reply(dest, nick, decodeURI(msg));
		return true;
	case "uricomponent":
		conn.reply(dest, nick, decodeURIComponent(msg));
		return true;
	case "charcode":
		conn.reply(dest, nick, String.fromCharCode.apply(null, msg.split(" ")));
		return true;
	case "albhed":
		conn.reply(dest, nick, tr(msg, this.AL_BHED, this.ALPHABET));
		return true;
	}
};

// from https://developer.mozilla.org/en/A_re-introduction_to_JavaScript
String.prototype.reverse = function reverse() {
	var s = "";
	for (var i = this.length - 1; i >= 0; i--)
		s += this[i];
	return s;
};
module.REVUPPER = module.UPPER.reverse();
module.REVLOWER = module.REVUPPER.toLowerCase();

/**
 * Translates text in a similar fashion to the UNIX <code>tr</code> utility.
 *
 * @param {string|string[]} str The string to transform.
 * @param {string|string[]} frm Table containing characters to replace.
 * @param {string|string[]} to Table containing characters to replace with.
 * @return {string} Transformed string.
 */
function tr(str, frm, to) {
	var s = "";
	for (var i = 0, j = 0, k = ""; i < str.length; i++) {
		if ((j = frm.indexOf(str[i])) == -1)
			k = str[i];
		else if (!(k = to[j]))
			k = "";
		s += k;
	}
	return s;
}
