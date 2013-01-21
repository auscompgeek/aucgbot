// -*- Mode: JavaScript; tab-width: 4 -*- vim:tabstop=4 syntax=javascript:
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
/*jshint es5: true, esnext: true */
/*global aucgbot: false, module: false */

if (!aucgbot.modules.badword)
	throw new Error("badword module not loaded");

module.version = "1.0 (20 Jan 2013)";

module.onNick = function onNick(conn, oldNick, newNick, ident, host) {
	const mod_badword = aucgbot.modules.badword, oldNickDB = mod_badword.getUser(oldNick);
	if (oldNickDB && !mod_badword.getUser(newNick))
		mod_badword.getUser(newNick, true).nick = oldNickDB.nick || oldNick;
};
