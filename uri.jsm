// -*- Mode: JavaScript; tab-width: 4 -*- vim:tabstop=4 syntax=javascript:
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
/*jshint es5: true, esnext: true, forin: true, proto: true */
/*global Stream: false, aucgbot: false, module: false */


module.version = "0.2 (11 Oct 2013)";
module.db = {};

module.loadDB = function loadDB() {
	var file;
	try {
		file = new Stream("schemes.json");
		this.db = JSON.parse(file.readFile());
	} catch (ex) {}
	if (file && typeof file.close === "function") {
		file.close();
	}
};
module.saveDB = function saveDB() {
	var file = new Stream("schemes.json", "w");
	file.write(JSON.stringify(this.db));
	file.close();
};
module.loadDB();

module.onUnknownMsg = function onUnknownMsg(dest, msg, nick, ident, host, conn, relay) {
	var match = msg.match(/(\w+?):\/\/((\w+?)\b)?/);
	if (match) {
		var scheme = match[1];
		var targ = match[2] || "";
		if (scheme in this.db) {
			conn.msg(dest, this.db[scheme].replace("%s", targ));
			return true;
		}
	}
}

module.cmd_addscheme = function cmd_addscheme(dest, msg, nick, ident, host, conn, relay) {
	var args = msg.split(" ");
	var scheme = args[0],
		uri = args[1];
	if (args.length !== 2) {
		conn.notice(nick, "Usage: addscheme <scheme> <uri>. Example: addscheme xkcd http://xkcd.com/%s (%s is filled in with the stuff after ://");
		return true;
	}
		
	if (scheme in this.db) {
		conn.reply(dest, nick, "there is already a scheme for " + args[0] + " in place!");
		return true;
	}
	if (!uri.contains("%s")) {
		conn.notice(nick, "uri requires a substitution (%s)");
		return true;
	}
	this.db[args[0]] = args[1];
	this.saveDB();
	return true;
};

module.cmd_delscheme = function cmd_delscheme(dest, msg, nick, ident, host, conn, relay) {
	var schemes = msg.split(" ");
	for (let i = 0,scheme; scheme = schemes[i]; i++) {
		if (scheme in this.db) {
			delete this.db[scheme];
			conn.notice(nick, "scheme " + scheme + " deleted.");
		}
	}
	this.saveDB();
	return true;
};
