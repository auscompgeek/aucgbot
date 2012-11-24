// -*- Mode: JavaScript; tab-width: 4 -*- vim:tabstop=4 syntax=javascript:
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

module.version = 1.0;
module.db = new Record();
module.db.caseSensitive = false;
module.db.TABLE_NAME = "Factoids";
module.db.load = function load() this.readINI(system.cwd + "/infobot.ini", this.TABLE_NAME);
module.db.save = function save() this.writeINI(system.cwd + "/infobot.ini", this.TABLE_NAME);
module.db.load();

module.cmd_def =
function cmd_def(dest, args, nick, ident, host, conn, relay) {
	var args = args.split("="), term = args.shift(), def = this.db.get(term);
	if (def)
		conn.reply(dest, nick, term, "is already defined:", def);
	else
		this.db.set(term, args.join("=")), this.db.save();
	return true;
}
module.cmd_no = function cmd_no(dest, args, nick) args = args.split("="), this.db.set(args.shift(), args.join("=")), this.db.save(), true;
module.cmd_reloadfacts = function cmd_reloadfacts(dest, args, nick, ident, host, conn)
	conn.reply(dest, nick, "Loaded", this.db.load(), "factoids."), true;
module.cmd_fact = module.cmd_info =
function cmd_fact(dest, args, nick, ident, host, conn, relay) {
	var def = this.db.get(args);
	if (def) conn.reply(dest, nick, def);
	return true;
}
module.cmd_what =
function cmd_what(dest, args, nick, ident, host, conn, relay) {
	/*args = args.split(" ");
	if (args.shift() != "is" || !args[0] || args[0] == "?")
		return false;
	var term = args.join(" ");
	if (term[-1] == "?")
		term = term.slice(0, -1);*/
	if (!/^is (.+?)\??$/i.test(args))
		return false;
	var def = this.db.get(RegExp.$1);
	if (def) {
		conn.reply(dest, nick, def);
		return true;
	}
}
module.cmd_tell =
function cmd_tell(dest, args, nick, ident, host, conn, relay) {
	var args = args.split(" "), to = args.shift();
	if (!args.length)
		conn.reply(dest, nick, "Usage: tell <nick> <term>");
	else if (to == conn.nick)
		conn.reply(dest, nick, "Get me to talk to myself, yeah, great idea...");
	else {
		if (args[0] == "about") args.shift();
		var term = args.join(" "), def = this.db.get(term);
		if (def) conn.msg(to, nick, "wanted you to know about", term + ":", def);
	}
	return true;
}
module.cmd_show =
function cmd_show(dest, args, nick, ident, host, conn, relay) {
	var args = args.split(" "), to = args.shift();
	if (!args.length)
		conn.reply(dest, nick, "Usage: show <nick> <term>");
	else if (to == conn.nick)
		conn.reply(dest, nick, "Get me to talk to myself, yeah, great idea...");
	else {
		var def = this.db.get(args.join(" "));
		if (def) conn.reply(dest, to, def);
	}
	return true;
}