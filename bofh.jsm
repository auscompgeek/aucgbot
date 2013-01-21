// -*- Mode: JavaScript; tab-width: 4 -*- vim:tabstop=4 syntax=javascript:
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
/*global Stream: false, module: false */

module.version = 0.1;

module.cmd_bofh = function cmd_bofh(dest, args, nick, ident, host, conn, relay) {
	var excuses;
	try {
		var file = new Stream("excuses.txt");
		excuses = file.readFile().split("\n");
		file.close();
	} catch (ex) {
		excuses = [
			"out of memory",
			"Typo in the code",
			"permission denied",
			"404 Excuses Not Found",
			"NOTICE: alloc: /dev/null: filesystem full",
			"YOU HAVE AN I/O ERROR -> Incompetent Operator error",
			"telnet: Unable to connect to remote host: Connection refused",
			"operation failed because: there is no message for this error (#1014)"
		];
	}
	conn.reply(dest, nick, excuses.random());
	return true;
};
