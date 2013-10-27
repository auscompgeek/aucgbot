// -*- Mode: JavaScript; tab-width: 4 -*- vim:tabstop=4 syntax=javascript:
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
/*global Stream: false, aucgbot: false, module: false, system: false */

module.version = 1.5;
module.BASE_URL = "http://api.duckduckgo.com/?format=json&no_redirect=1&no_html=1&skip_disambig=1&t=aucgbot&q=";

module.cmd_ddg = module.duck = module.duckduckgo =
function cmd_ddg(e) {
	var dest = e.dest, args = e.args, nick = e.nick, conn = e.conn;
	if (!args) {
		conn.reply(dest, nick, "Get DuckDuckGo zero-click info. Usage: ddg <query>");
		return true;
	}

	var data, q = encodeURIComponent(args);
	try {
		data = aucgbot.getJSON(this.BASE_URL + q, "ddg", this.version);
	} catch (ex) {}

	if (!data) {
		conn.reply(dest, nick, "DuckDuckGo returned no data.");
		return true;
	}

	var res0 = data.Results[0];
	if (data.Answer)
		conn.reply(dest, nick, data.AnswerType + ":", data.Answer);
	else if (data.Abstract)
		conn.reply(dest, nick, data.Heading, "(" + data.AbstractSource + "):", decodeHTML(data.AbstractText),
				data.AbstractURL + (res0 ? " [" + res0.Text + ": " + res0.FirstURL + "]" : ""));
	else if (data.Definition)
		conn.reply(dest, nick, data.Definition, data.DefinitionURL);
	else if (data.Redirect)
		conn.reply(dest, nick, data.Redirect);
	else
		conn.reply(dest, nick, "No instant answers. Try searching DuckDuckGo: https://duckduckgo.com/?t=aucgbot&q=" + q);

	return true;
};
