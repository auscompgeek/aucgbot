// -*- Mode: JavaScript; tab-width: 4 -*- vim:tabstop=4 syntax=javascript:
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
/*global Record: false, aucgbot: false, module.exports: false, system: false */

module.exports.version = 0.7;
module.exports.db = {};
module.exports.filename = "karma.json";
module.exports.load = function load() {
	this.db = JSON.parse(aucgbot.readURI(this.filename) || "{}");
};
module.exports.save = function save() {
	fs.writeFileSync(JSON.stringify(this.db));
}
module.exports.increment = function increment(x, y) { this.db[x] = (this.db[x] || 0) + y };
try { module.exports.db.load(); } catch (ex) {}

module.exports.onMsg = function onMsg(e) {
	if (!/^(\S+)([-+])\2$/.test(e.msg))
		return;
	var item = RegExp.$1.toLowerCase(), minus = RegExp.$2 == "-";
	if (item == e.nick)
		minus = true;
	this.increment(item, Math.pow(-1, minus));
	this.save();
};

module.exports.cmd_karma = function cmd_karma(e) {
	var nick = e.nick, args = e.args || nick;
	e.conn.reply(e.dest, nick, args, "has", this.db[args.toLowerCase()] || "no", "karma.");
	return true;
};
