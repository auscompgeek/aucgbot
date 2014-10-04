// -*- Mode: JavaScript; tab-width: 4 -*- vim:tabstop=4 syntax=javascript:
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
/*jshint es5: true, esnext: true */
/*global aucgbot: false, module.exports: false, writeln: false */
"use strict";
if (!aucgbot.modules.badword)
	throw new Error("badword module.exports not loaded");

module.exports.version = "1.3 (2013-11-21)";

module.exports.onNick = function onNick(e) {
	const mod_badword = aucgbot.modules.badword;
	if (!mod_badword) {
		writeln("[WARNING] badword module not loaded");
		return false;
	}
	const oldNick = e.oldNick.split("|")[0], oldNickDB = mod_badword.getUser(oldNick), newNick = e.newNick.split("|")[0];
	if (oldNickDB && !mod_badword.getUser(newNick))
		mod_badword.getUser(newNick, true).nick = oldNickDB.nick || oldNick;
};
