// -*- Mode: JavaScript; tab-width: 4 -*- vim:tabstop=4 syntax=javascript:
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

module.version = 0.2;
module.db = new Record();
module.db.caseSensitive = false;
module.TABLE_NAME = "Factoids";

module.loadDB = function loadDB() this.db.readINI(system.cwd + "/infobot.ini", this.TABLE_NAME);
module.saveDB = function saveDB() this.db.writeINI(system.cwd + "/infobot.ini", this.TABLE_NAME);
module.loadDB();

module.cmd_def =
function cmd_def(dest, args, nick, ident, host, serv, relay) {
	var args = args.split(" "), term = args[0], def = args.slice(1).join(" ");
	if (this.db.get(term))
		aucgbot.reply(serv, dest, nick, term, "is already defined:", this.db.get(term));
	else {
		this.db.set(term, def);
		this.saveDB();
	}
	return true;
}
module.cmd_no =
function cmd_no(dest, args, nick, ident, host, serv, relay) {
	var args = args.split(" "), term = args[0], def = args.slice(1).join(" ");
	this.db.set(term, def);
	this.saveDB();
	return true;
}
module.cmd_reloadfacts =
function cmd_reloadfacts(dest, args, nick, ident, host, serv, relay) {
	aucgbot.reply(serv, dest, nick, "Loaded", this.loadDB(), "factoids.");
	return true;
}
module.cmd_fact =
function cmd_fact(dest, args, nick, ident, host, serv, relay) {
	var def = this.db.get(args);
	if (def)
		aucgbot.reply(serv, dest, nick, def);
	return true;
}
module.cmd_sendfact =
function cmd_sendfact(dest, args, nick, ident, host, serv, relay) {
	var args = args.split(" ");
	if (args.length != 2)
		aucgbot.reply(serv, dest, nick, "Usage: sendfact <nick> <term>");
	else if (args[0] == serv.nick)
		this.reply(serv, dest, nick, "Get me to talk to myself, yeah, great idea...");
	else {
		let def = this.db.get(args[1]);
		if (def)
			aucgbot.send(serv, args[0], nick, "wanted you to know about", args[1] + ":", def);
	}
	return true;
}
module.cmd_showfact =
function cmd_showfact(dest, args, nick, ident, host, serv, relay) {
	var args = args.split(" ");
	if (args.length != 2)
		aucgbot.reply(serv, dest, nick, "Usage: showfact <nick> <term>");
	else if (args[0] == serv.nick)
		this.reply(serv, dest, nick, "Get me to talk to myself, yeah, great idea...");
	else {
		let def = this.db.get(args[1]);
		if (def)
			aucgbot.send(serv, args[0], args[1] + ":", def);
	}
	return true;
}