// -*- Mode: JavaScript; tab-width: 4 -*- vim:tabstop=4 syntax=javascript:
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
/*global module: false */

(function (module) {
module.version = 0.3;

module.cmd_bofh = function cmd_bofh(e) {
	var excuses;
	try {
		excuses = e.bot.readFile("excuses.txt").split("\n");
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
	e.reply(excuses.random());
	return true;
};
})(module.exports);
