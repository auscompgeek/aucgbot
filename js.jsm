// -*- Mode: JavaScript; tab-width: 4 -*- vim:tabstop=4 syntax=javascript:
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

module.version = "0.5 (23 Aug 2012)";
//module.prefs = { internal: true }

module.cmd_js =
function cmd_js(dest, msg, nick, ident, host, serv, relay) {
	var ret, pin;
	if (!msg) {
		aucgbot.reply(serv, dest, nick, "Usage: js <expr>");
		return true;
	}
	pin = system.safeMode();
	try {
		aucgbot.reply(serv, dest, nick, this.eval(msg));
	} catch (ex) { aucgbot.reply(serv, dest, nick, "uncaught exception:", ex); }
	system.safeMode(pin);
	return true;
}
module.eval =
function _eval(expr) {
	var ret, o = {aucgbot:null,system:null};
	with (o) ret = eval.call(o, msg);
	if (typeof ret == "function")
		return "(function) " + ret.name;
	if (ret == null) {
		delete o.aucgbot; delete o.system;
		let s = JSON.stringify(o);
		if (s != "{}") return s;
	}
	return "(" + typeof ret + ") " + JSON.stringify(ret);
}