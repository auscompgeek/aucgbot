// -*- Mode: JavaScript; tab-width: 4 -*- vim:tabstop=4 syntax=javascript:
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
/*global Record: false, aucgbot: false, module: false, system: false */

module.version = 0.6;
module.db = new Record();
module.db.caseSensitive = false;
module.db.FILENAME = "karma.ini";
module.db.TABLE_NAME = "Karma";
module.db.load = function load() this.readINI(system.cwd + "/" + this.FILENAME, this.TABLE_NAME);
module.db.save = function save() this.writeINI(system.cwd + "/" + this.FILENAME, this.TABLE_NAME);
module.db.increment = function increment(x, y) this.set(x, (+this.get(x) || 0) + y);
module.db.load();

module.onMsg = function onMsg(dest, msg, nick, ident, host, conn, relay) {
	if (!/^(\S+)([-+])\2$/.test(msg))
		return;
	var item = RegExp.$1, minus = RegExp.$2 == "-";
	if (item == nick)
		minus = true;
	this.db.increment(item, Math.pow(-1, minus));
	this.db.save();
};

module.cmd_karma = function cmd_karma(dest, args, nick, ident, host, conn, relay) {
	args = args || nick;
	conn.reply(dest, nick, args, "has", this.db.get(args) || "no", "karma.");
	return true;
};
