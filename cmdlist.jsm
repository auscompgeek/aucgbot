// -*- Mode: JavaScript; tab-width: 4 -*- vim:tabstop=4 syntax=javascript:
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

module.version = 0.1;

module.cmd_cmdlist =
function cmd_cmdlist(dest, args, nick, ident, host, serv, relay) {
	var cmds = [];
	for each (let module in aucgbot.modules) {
		if (module == this)
			continue;
		for (let i in module) {
			if (i.slice(0, 3) == "cmd_")
				cmds.push(i.slice(3));
		}
	}
	if (cmds.length)
		aucgbot.reply(serv, dest, nick, cmds.join(" "));
}