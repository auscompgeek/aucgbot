// -*- Mode: JavaScript; tab-width: 4 -*- vim:tabstop=4 syntax=javascript:
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
/*global module: false */

module.version = 1.6;
module.BASE_URL = "http://api.duckduckgo.com/?format=json&no_redirect=1&no_html=1&skip_disambig=1&t=aucgbot&q=";

module.cleanAbstract = function cleanAbstract(text) {
	text = decodeHTML(text);
	if (text.length > 300) {
		var l = text.lastIndexOf(". ", 300);
		if (l != -1) {
			l = 300;
		}
		text = text.slice(0, l);
		text += " ...";
	}
	return text;
}

module.cmd_ddg = module.duck = module.duckduckgo =
function cmd_ddg(e) {
	if (!e.args) {
		e.reply(this.cmd_ddg.help);
		return true;
	}

	var data, q = encodeURIComponent(e.args);
	try {
		data = e.bot.getJSON(this.BASE_URL + q, "ddg", this.version);
	} catch (ex) {}

	if (!data) {
		e.reply("DuckDuckGo returned no data.");
		return true;
	}

	var res0 = data.Results[0];
	if (data.Answer)
		e.reply(data.AnswerType + ":", data.Answer);
	else if (data.Abstract)
		e.reply(data.Heading, "(" + data.AbstractSource + "):", this.cleanAbstract(data.AbstractText),
				data.AbstractURL + (res0 ? " [" + res0.Text + ": " + res0.FirstURL + "]" : ""));
	else if (data.Definition)
		e.reply(data.Definition, data.DefinitionURL);
	else if (data.Redirect)
		e.reply(data.Redirect);
	else
		e.reply("No instant answers.");

	return true;
};
module.cmd_ddg.help = "Get DuckDuckGo zero-click info. Usage: ddg <query>";
