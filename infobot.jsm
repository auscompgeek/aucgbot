// -*- Mode: JavaScript; tab-width: 4 -*- vim:tabstop=4 syntax=javascript:
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

module.version = 0.5;
module.db = new Record();
module.db.caseSensitive = false;
module.TABLE_NAME = "Factoids";

module.loadDB = function loadDB() this.db.readINI(system.cwd + "/infobot.ini", this.TABLE_NAME);
module.saveDB = function saveDB() this.db.writeINI(system.cwd + "/infobot.ini", this.TABLE_NAME);
module.loadDB();

module.cmd_def =
function cmd_def(dest, args, nick, ident, host, conn, relay) {
	var args = args.split("="), term = args[0], def = args.slice(1).join("=");
	if (this.db.get(term))
		conn.reply(dest, nick, term, "is already defined:", this.db.get(term));
	else {
		this.db.set(term, def);
		this.saveDB();
	}
	return true;
}
module.cmd_no =
function cmd_no(dest, args, nick, ident, host, conn, relay) {
	var args = args.split("="), term = args[0], def = args.slice(1).join("=");
	this.db.set(term, def);
	this.saveDB();
	return true;
}
module.cmd_reloadfacts =
function cmd_reloadfacts(dest, args, nick, ident, host, conn, relay) {
	conn.reply(dest, nick, "Loaded", this.loadDB(), "factoids.");
	return true;
}
module.cmd_fact = module.cmd_info =
function cmd_fact(dest, args, nick, ident, host, conn, relay) {
	var def = this.db.get(args);
	if (def)
		conn.reply(dest, nick, def);
	return true;
}
module.cmd_tell =
function cmd_tell(dest, args, nick, ident, host, conn, relay) {
	var args = args.split(" ");
	if (args.length < 2)
		conn.reply(dest, nick, "Usage: tell <nick> <term>");
	else if (args[0] == conn.nick)
		conn.reply(dest, nick, "Get me to talk to myself, yeah, great idea...");
	else {
		var term = args.slice(args[1] == "about" ? 2 : 1).join(" "), def = this.db.get(term);
		if (def)
			conn.msg(args[0], nick, "wanted you to know about", term + ":", def);
	}
	return true;
}
module.cmd_show =
function cmd_show(dest, args, nick, ident, host, conn, relay) {
	var args = args.split(" ");
	if (args.length < 2)
		conn.reply(dest, nick, "Usage: show <nick> <term>");
	else if (args[0] == conn.nick)
		conn.reply(dest, nick, "Get me to talk to myself, yeah, great idea...");
	else {
		var term = args.slice(1).join(" "), def = this.db.get(term);
		if (def)
			conn.reply(dest, args[0], def);
	}
	return true;
}