// -*- Mode: JavaScript; tab-width: 4 -*- vim:tabstop=4 syntax=javascript:
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
/*global Record: false, aucgbot: false, module: false, system: false */

module.version = 1.5;
module.db = new Record();
module.db.caseSensitive = false;
module.db.FILENAME = "infobot.ini";
module.db.TABLE_NAME = "Factoids";
module.db.load = function load() this.readINI(system.cwd + "/" + this.FILENAME, this.TABLE_NAME);
module.db.save = function save() this.writeINI(system.cwd + "/" + this.FILENAME, this.TABLE_NAME);
try { module.db.load(); } catch (ex) {}

module.cmd_def = function cmd_def(e) {
	var args = e.args.split("="), term = args.shift(), def = this.db.get(term);
	if (def)
		e.conn.reply(e.dest, e.nick, term, "is already defined:", def);
	else
		this.db.set(term, args.join("=")), this.db.save();
	return true;
};
module["cmd_no,"] = module.cmd_no = function cmd_no(dest, args, nick, ident, host, conn, relay) {
	var args = e.args.split("=");
	this.db.set(args.shift(), args.join("="));
	this.db.save();
	return true;
};
module.cmd_reloadfacts = function cmd_reloadfacts(dest, args, nick, ident, host, conn, relay) {
	e.conn.reply(e.dest, e.nick, "Loaded", this.db.load(), "factoids.");
	return true;
};
module.cmd_fact = module.cmd_info = function cmd_fact(dest, args, nick, ident, host, conn, relay) {
	var def = this.db.get(args);
	if (def)
		e.conn.reply(e.dest, e.nick, def);
	return true;
};
module["cmd_what's"] = function cmd_whats(dest, args, nick, ident, host, conn, relay) {
	var def = this.db.get(args.replace(/\?$/, ""));
	if (def) {
		e.conn.reply(e.dest, e.nick, def);
		return true;
	}
};
module.cmd_who = module.cmd_what = function cmd_what(dest, args, nick, ident, host, conn, relay) {
	if (!/^(?:is|are) (.+?)\??$/i.test(args))
		return false;
	var def = this.db.get(RegExp.$1);
	if (def) {
		e.conn.reply(e.dest, e.nick, def);
		return true;
	}
};
module.cmd_tell = function cmd_tell(dest, args, nick, ident, host, conn, relay) {
	var dest = e.dest, args = e.args, nick = e.nick, conn = e.conn;
	if (!args) {
		conn.reply(dest, nick, this.cmd_tell.help);
		return true;
	}
	args = args.split(" ");
	var to = args.shift();
	if (!args.length)
		conn.reply(dest, nick, this.cmd_tell.help);
	else if (to == conn.nick)
		conn.reply(dest, nick, aucgbot.ERR_MSG_SELF);
	else {
		if (args[0] == "about")
			args.shift();
		var term = args.join(" "), def = this.db.get(term);
		if (def)
			conn.msg(to, nick, "wanted you to know about", term + ":", def);
	}
	return true;
};
module.cmd_tell.help = "Send a factoid to a user in PM. Usage: tell <nick> <term>";
module.cmd_show = function cmd_show(dest, args, nick, ident, host, conn, relay) {
	var dest = e.dest, args = e.args, nick = e.nick, conn = e.conn;
	if (!args) {
		conn.reply(dest, nick, this.cmd_show.help);
		return true;
	}
	args = args.split(" ");
	var to = args.shift();
	if (!args.length)
		conn.reply(dest, nick, this.cmd_show.help);
	else if (to == conn.nick)
		conn.reply(dest, nick, aucgbot.ERR_MSG_SELF);
	else {
		var def = this.db.get(args.join(" "));
		if (def)
			conn.reply(dest, to, def);
	}
	return true;
};
module.cmd_show.help = "Show another user in channel a factoid. Usage: show <nick> <term>";
