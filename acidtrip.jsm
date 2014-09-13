// -*- Mode: JavaScript; tab-width: 4 -*- vim:ts=4 sw=4 syntax=javascript:
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
/*global module.exports: false */

module.exports.version = "0.2 (2013-10-26)";
module.exports.cmd_acidtrip = function cmd_acidtrip(e) {
	var s = '', msg = e.args,
		maxi = Math.ceil(msg.length / 60),
		last = msg.length % 60,
		lastIndex = 0, mlen = 0, fg = 0, bg = 0;
	for (var j = 0; j < maxi; j++) {
		mlen = 60;
		if (j + 1 == maxi) {
			mlen = last;
		}
		for (var i = lastIndex; i < (lastIndex + mlen); i++) {
			fg = randint(0, 15);
			bg = randint(0, 15);
			if (fg == bg) {
				fg++;
				fg %= 15;
			}
			if (bg < 10) {
				bg = '0' + bg;
			}
			s += '\x03' + fg + ',' + bg + msg[i];
		}
		e.conn.msg(e.dest, s);
		lastIndex += mlen;
		s = '';
	}
	return true; // Say that we've reached a valid command and stop processing the message.
};
