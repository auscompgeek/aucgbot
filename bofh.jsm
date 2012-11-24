// -*- Mode: JavaScript; tab-width: 4 -*- vim:tabstop=4 syntax=javascript:
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

module.version = 0.1;

module.cmd_bofh =
function cmd_bofh(dest, args, nick, ident, host, conn, relay) {
	try {
		var stream = new Stream("net://bofh.jeffballard.us:666"), data = stream.readFile();
	} catch (ex) {}
	stream.close();
	conn.reply(dest, nick, data || "telnet: Unable to connect to remote host: Connection refused");
	return true;
}
