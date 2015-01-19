// -*- Mode: JavaScript; tab-width: 4 -*- vim:tabstop=4 syntax=javascript:
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
/*global Record: false, aucgbot: false, module: false, system: false */

module.version = 0.7;
module.db = new Record();
module.db.caseSensitive = false;
module.db.FILENAME = "karma.ini";
module.db.TABLE_NAME = "Karma";
module.db.load = function load() this.readINI(system.cwd + "/" + this.FILENAME, this.TABLE_NAME);
module.db.save = function save() this.writeINI(system.cwd + "/" + this.FILENAME, this.TABLE_NAME);
module.db.increment = function increment(x, y) this.set(x, (+this.get(x) || 0) + y);
try { module.db.load(); } catch (ex) {}

module.onMsg = function onMsg(e) {
	if (!/^(\S+)([-+])\2$/.test(e.msg))
		return;
	var item = RegExp.$1, minus = RegExp.$2 == "-";
	if (item == e.nick)
		minus = true;
	this.db.increment(item, Math.pow(-1, minus));
	this.db.save();
};

module.cmd_karma = function cmd_karma(e) {
	var nick = e.args || e.nick;
	e.reply(nick, "has", this.db.get(nick) || "no", "karma.");
	return true;
};
