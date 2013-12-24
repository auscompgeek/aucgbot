// -*- Mode: JavaScript; tab-width: 4 -*- vim:tabstop=4 syntax=javascript:
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
/*global module: false */

module.version = 1.2;
module.BASE_URL = "http://api.urbandictionary.com/v0/";
module.DEFINE_BASE_URL = module.BASE_URL + "define?term=";

module.defToText = function defToText(def, ex) {
	var text = def[ex ? "example" : "definition"].trim().replace(/\[([^\[\]]+)\]/g, "$1"), shorttext = text.split("\r\n")[0];
	if (text !== shorttext) {
		if (shorttext.length > 250 && /^(.*?\.)\s/.test(shorttext)) {
			shorttext = RegExp.$1;
		}
		return "{0} ... {1}".format(shorttext, def.permalink);
	}
	return "{0} {1}".format(text, def.permalink);
};

module.cmd_ud = module.cmd_urban =
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
module.cmd_ud.help = "Search Urban Dictionary. Usage: ud <term>";

module.cmd_urbanex =
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
		e.send(this.defToText(def0, true));
	} else {
		e.reply("No results.");
	}
	return true;
};
module.cmd_urbanex.help = "Get the top Urban Dictionary definition's example for a word. Usage: urbanex <term>";
