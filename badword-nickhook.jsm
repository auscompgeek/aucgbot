// -*- Mode: JavaScript; tab-width: 4 -*- vim:tabstop=4 syntax=javascript:
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
/*jshint es5: true, esnext: true */
/*global aucgbot: false, module: false, writeln: false */

if (!aucgbot.modules.badword)
	throw new Error("badword module not loaded");

module.version = "1.2 (2013-10-26)";

module.onNick = function onNick(e) {
	const mod_badword = aucgbot.modules.badword;
	if (!mod_badword) {
		writeln("[WARNING] badword module not loaded");
		return false;
	}
	const oldNickDB = mod_badword.getUser(e.oldNick), newNick = e.newNick;
	if (oldNickDB && !mod_badword.getUser(newNick))
		mod_badword.getUser(newNick, true).nick = oldNickDB.nick || oldNick;
};
