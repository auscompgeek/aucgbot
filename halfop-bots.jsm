// -*- Mode: JavaScript; tab-width: 4 -*- vim:tabstop=4 syntax=javascript:
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

module.version = 1.4;
module.parseln =
function parseln(ln, conn) {
	if (/^:([^\s!@]+)![^\s!@]+@[^\s!@]+ JOIN :#bots\r/.test(ln)) {
		var nick = RegExp.$1;
		if (nick == conn.nick)
			return;
		if (/^bot|bot[\d_]*$/.test(RegExp.$1))
			conn.send("MODE #bots +h", nick);
		else
			conn.send("WHO", nick);
	} else if (/^:\S+ 352 \S+ #bots \S+ \S+ (\S+) (\S+) :\d+ \S+/.test(ln)) {
		if (RegExp.$2.indexOf("B") != -1)
			conn.send("MODE #bots +h", RegExp.$1);
	}
};
