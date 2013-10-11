// -*- Mode: JavaScript; tab-width: 4 -*- vim:ts=4 sw=4 syntax=javascript:
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
/*global module: false */

module.version = "0.1 (10 Oct 2013)";
module.cmd_acidtrip = function cmd_acidtrip(dest, msg, nick, ident, host, conn, relay) {
	var i,s=''
	var maxi=Math.ceil(msg.length/60);
	var last=msg.length%60;
	var lastIndex=0;
	println(maxi);
	for (j=0;j<maxi;j++) {
		mlen=60;
		if (j+1==maxi) {
			mlen=last;
		}
		println(lastIndex);
		println(mlen);
		for(i=lastIndex;i<(lastIndex+mlen);i++ ) {
			print(i + " => " + msg.charAt(i) + ", ");
			fg=randint(0,15);
			bg=randint(0,15);
			if (fg == bg) {
				fg++;
				fg %= 15;
			}
			if ((""+fg).length == 1) {
				fg = "0" + fg;
			}
			if ((""+bg).length == 1) {
				bg = "0" + bg;
			}
			s +='\003'+fg+','+bg+msg.charAt(i);
		}
		println()
		conn.msg(dest, s);
		lastIndex+=mlen;
		s=''
	}
	return true; // Say that we've reached a valid command and stop processing the message.
};
