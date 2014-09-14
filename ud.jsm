// -*- Mode: JavaScript; tab-width: 4 -*- vim:tabstop=4 syntax=javascript:
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
/*global module.exports: false */

module.exports.version = 1.4;
module.exports.BASE_URL = "http://api.urbandictionary.com/v0/";
module.exports.DEFINE_BASE_URL = module.exports.BASE_URL + "define?term=";

module.exports.defToText = function defToText(def, field) {
	var text = def[field || "definition"].trim().replace(/\[([^\[\]]+)\]/g, "$1").replace("\r\n", "\n", "g");
	if (text.length > 350) {
		text = text.split("\n")[0];
		if (text.length > 350) {
			// guys pls
			var l = text.lastIndexOf(". ", 350);
			if (l != -1) {
				// I give up...
				l = 350;
			}
			text = text.slice(0, l);
		}
		text += " ...";
	}
	return "{0} {1}".format(text, def.permalink);
};

module.exports.cmd_ud = module.exports.cmd_urban =
function cmd_ud(e) {
	var term = e.args;
	if (!term) {
		e.reply(this.cmd_ud.help);
		return true;
	}

	var data;
	try {
		// WHY URBAN DICTIONARY? WHY!?!?!?!?!??!?!?
		data = JSON.parse(e.bot.readURI(this.DEFINE_BASE_URL + encodeURIComponent(term)));
	} catch (ex) {}

	if (!data) {
		e.reply("Urban Dictionary returned no data.");
		return true;
	}

	var def0 = data.list[0];
	if (def0) {
		e.send(this.defToText(def0));
	} else {
		e.reply("No results.");
	}
	return true;
};
module.exports.cmd_ud.help = "Search Urban Dictionary. Usage: ud <term>";

module.exports.cmd_urbanex =
function cmd_urbanex(e) {
	var term = e.args;
	if (!term) {
		e.reply(this.cmd_ud.help);
		return true;
	}

	var data;
	try {
		// seriously guys, fix the goddamn API server.
		data = JSON.parse(e.bot.readURI(this.DEFINE_BASE_URL + encodeURIComponent(term)));
	} catch (ex) {}

	if (!data) {
		e.reply("Urban Dictionary returned no data.");
		return true;
	}

	var def0 = data.list[0];
	if (def0) {
		e.send(this.defToText(def0, "example"));
	} else {
		e.reply("No results.");
	}
	return true;
};
module.exports.cmd_urbanex.help = "Get the top Urban Dictionary definition's example for a word. Usage: urbanex <term>";
