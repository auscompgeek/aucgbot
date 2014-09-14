// -*- Mode: JavaScript; tab-width: 4 -*- vim:tabstop=4 syntax=javascript:
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
/** @fileoverview aucgbot module.exports: Transform text. */
/*jshint es5: true, esnext: true, nonstandard: true */
/*global decodeB64: false, decodeHTML: false, decodeURL: false, encodeB64: false, encodeHTML: false, encodeURL: false, module.exports: false */

module.exports.version = 2.91;
module.exports.UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
module.exports.LOWER = "abcdefghijklmnopqrstuvwxyz";
module.exports.ALPHABET = module.exports.UPPER + module.exports.LOWER;
module.exports.AL_BHED = "YPLTAVKREZGMSHUBXNCDIJFQOWypltavkrezgmshubxncdijfqow";
module.exports.GOOGLERESE = "ynficwlbkuomxsevzpdrjgthaq";
module.exports.DIGITS = "0123456789";

module.exports.cmd_tr = function cmd_tr(e) {
	var args = /^"((?:\\")*[^"]+(?:\\"[^"]*)*)" "((?:\\")*[^"]+(?:\\"[^"]*)*)" "((?:\\")*[^"]+(?:\\"[^"]*)*)"$/.exec(e.args);
	e.reply(args ? (args.shift(), tr.apply(null, args)) : this.cmd_tr.help);
	return true;
};
module.exports.cmd_tr.help = 'Like the UNIX tr utility. Usage: tr "<text>" "<trFromTable>" "<trToTable>"';

module.exports.cmd_rot13 = function cmd_rot13(e) {
	var msg = e.args;
	if (!msg) {
		e.reply(this.cmd_rot13.help);
		return true;
	}
	e.reply(tr(msg, this.ALPHABET, "NOPQRSTUVWXYZABCDEFGHIJKLMnopqrstuvwxyzabcdefghijklm"));
	return true;
};
module.exports.cmd_rot13.help = "ROT13 text. Usage: rot13 <text>";

module.exports.cmd_rot47 = function cmd_rot47(e) {
	var msg = e.args;
	if (!msg) {
		e.reply(this.cmd_rot47.help);
		return true;
	}
	e.reply(tr(msg, "!\"#$%&\'()*+,-./0123456789:;<=>?@" + this.UPPER + "[\\]^_`" + this.LOWER + "{|}~", "PQRSTUVWXYZ[\\]^_`" + this.LOWER + "{|}~!\"#$%&\'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNO"));
	return true;
};
module.exports.cmd_rot47.help = "ROT47 text. Usage: rot47 <text>";

module.exports.cmd_revtr = function cmd_revtr(e) {
	var msg = e.args;
	if (!msg) {
		e.reply(this.cmd_revtr.help);
		return true;
	}
	e.reply(tr(msg, this.ALPHABET, this.REVUPPER + this.REVLOWER));
	return true;
};
module.exports.cmd_revtr.help = "A reversed alphabet Caesar cyphar. Usage: revtr <text>";

module.exports.cmd_rev = function cmd_rev(e) {
	var msg = e.args;
	if (!msg) {
		e.reply(this.cmd_rev.help);
		return true;
	}
	e.reply(msg.reverse());
	return true;
};
module.exports.cmd_rev.help = "Reverse text. Usage: rev <text>";

module.exports.cmd_revword = function cmd_revword(e) {
	var msg = e.args;
	if (!msg) {
		e.reply(this.cmd_revword.help);
		return true;
	}
	e.reply(msg.split(" ").map(String.reverse).join(" "));
	return true;
};
module.exports.cmd_revword.help = "Reverse words. Usage: revword <text>";

module.exports.cmd_encode = function cmd_encode(e) {
	var args = e.args;
	if (!args) {
		e.reply(this.cmd_encode.help);
		return true;
	}
	args = args.split(" ");
	var type = args.shift().toLowerCase(), msg = args.join(" ");
	switch (type) {
	case "base64": case "b64":
		e.reply(encodeB64(msg));
		return true;
	case "html":
		e.reply(encodeHTML(msg));
		return true;
	case "url":
		e.reply(encodeURL(msg));
		return true;
	case "uri":
		e.reply(encodeURI(msg));
		return true;
	case "uricomponent":
		e.reply(encodeURIComponent(msg));
		return true;
	case "escape":
		e.reply(escape(msg));
		return true;
	case "charcode": case "dec": case "hex": case "bin":
		var s = [];
		for (var i = 0; i < msg.length; i++) {
			if (type == "bin") {
				s.push(msg.charCodeAt(i).toString(2).zfill(8));
			} else {
				s.push(msg.charCodeAt(i).toString(type == "hex" ? 16 : 10));
			}
		}
		e.reply(s.join(" "));
		return true;
	case "albhed":
		e.reply(tr(msg, this.ALPHABET, this.AL_BHED));
		return true;
	case "googlerese":
		e.reply(tr(msg, this.LOWER, this.GOOGLERESE));
		return true;
	}
};
module.exports.cmd_encode.help = "Encode stuff. Usage: encode <type> <text>";

module.exports.cmd_decode = function cmd_decode(e) {
	var args = e.args;
	if (!args) {
		e.reply(this.cmd_decode.help);
		return true;
	}
	args = args.split(" ");
	var type = args.shift().toLowerCase(), msg = args.join(" ");
	switch (type) {
	case "base64": case "b64":
		e.reply(decodeB64(msg));
		return true;
	case "html":
		e.reply(decodeHTML(msg));
		return true;
	case "url":
		e.reply(decodeURL(msg));
		return true;
	case "uri":
		e.reply(decodeURI(msg));
		return true;
	case "uricomponent":
		e.reply(decodeURIComponent(msg));
		return true;
	case "escape":
		e.reply(unescape(msg));
		return true;
	case "charcode":
		e.reply(String.fromCharCode.apply(null, args));
		return true;
	case "codepoint": case "codept": case "dec":
		e.reply(String.fromCodePoint.apply(null, args));
		return true;
	case "hex":
		if (args.length === 1 && msg.length > 4) {
			args = msg.match(/.{1,2}/g);
		}
		e.reply(String.fromCodePoint.apply(null, args.map(function (x) { return parseInt(x, 16); })));
		return true;
	case "bin":
		e.reply(String.fromCodePoint.apply(null, args.map(function (x) { return parseInt(x, 2); })));
		return true;
	case "albhed":
		e.reply(tr(msg, this.AL_BHED, this.ALPHABET));
		return true;
	case "googlerese":
		e.reply(tr(msg, this.GOOGLERESE, this.LOWER));
		return true;
	}
};
module.exports.cmd_decode.help = "Decode stuff. Usage: decode <type> <text>";

module.exports.cmd_rainbow = function cmd_rainbow(e) {
	var msg = e.args;
	if (!msg) {
		e.reply(this.cmd_rainbow.help);
		return true;
	}
	function f(n) { return n < 10 ? "0" + n : n; }
	var s = "";
	for (var i = 0, chr; i < msg.length; i++) {
		chr = msg[i];
		if (this.DIGITS.contains(chr)) {
			s += "\x03" + f(randint(0, 15)) + chr;
		} else {
			s += "\x03" + randint(0, 15) + chr;
		}
	}
	e.nmsg(s);
	return true;
};
module.exports.cmd_rainbow.help = "Rainbows, rainbows everywhere! Usage: rainbow <text>";

// from https://developer.mozilla.org/en/A_re-introduction_to_JavaScript
// henceforth licensed in whatever license the MDN is (probably MPL)
String.reverse = function reverse(str) {
	var s = "";
	for (var i = str.length - 1; i >= 0; i--)
		s += str[i];
	return s;
};
String.prototype.reverse = function reverse() { return String.reverse(this); };

module.exports.REVUPPER = module.exports.UPPER.reverse();
module.exports.REVLOWER = module.exports.REVUPPER.toLowerCase();

String.zfill = function zfill(str, l) {
	while (str.length < l)
		str = "0" + str;
	return str;
};
String.prototype.zfill = function zfill(l) { return String.zfill(this, l); };

// shim for ES5: ECMA-262 6th Edition, 15.5.3.3
String.fromCodePoint = function fromCodePoint() {
	var points = [];
	Array.forEach(arguments, function (offset) {
		if (offset < 0x10000)
			points.push(offset);
		else {
			offset -= 0x10000;
			points.push(0xD800 | (offset >> 10), 0xDC00 | (offset & 0x3FF));
		}
	});
	return String.fromCharCode.apply(null, points);
};

/**
 * Translates text in a similar fashion to the UNIX tr utility.
 *
 * @param {string} str The string to transform.
 * @param {string} frm Table containing characters to replace.
 * @param {string} to Table containing characters to replace with.
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
