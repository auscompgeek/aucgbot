// -*- Mode: JavaScript; tab-width: 4 -*- vim:tabstop=4 syntax=javascript:
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
/*global module: false */

module.version = 2.2;
module.SEARCH_API_BASE = "http://ajax.googleapis.com/ajax/services/search/web?v=1.0&rsz=1&q=";
module.HUMAN_NOJS_SEARCH_BASE = "http://www.google.com/search?gbv=1&q=";
// yes, I'm scraping HTML with regex. get over it.
// regex stolen from jenni, a fellow bot: https://github.com/myano/jenni/blob/master/modules/calc.py
// This regex is Copyright 2009-2013, Michael Yanovich (yanovich.net). Licensed under the Eiffel Forum License 2.
module.CALC_REGEX = /<(?:h2 class="r"|div id="aoba")[^>]*>(.+?)<\/(?:h2|div)>/;

module.cmd_g = module.cmd_google =
function cmd_google(e) {
	var args = e.args;
	if (!args) {
		e.reply(this.cmd_g.help);
		return true;
	}

	var data;
	try {
		data = e.bot.getJSON(this.SEARCH_API_BASE + encodeURIComponent(args), "google", this.version);
	} catch (ex) {}

	if (!data) {
		e.reply("Google returned no data.");
		return true;
	}
	if (data.responseStatus != 200) {
		e.reply(data.responseStatus, data.responseDetails);
		return true;
	}

	var res0 = data.responseData.results[0];
	if (res0) {
		e.reply(
			unescape(res0.url), "-", decodeHTML(res0.titleNoFormatting), "-",
			decodeHTML(res0.content).replace(/<\/?b>/g, "\002")
		);
	} else {
		e.reply("No results.");
	}
	return true;
};
module.cmd_g.help = "Grab the first Google search result. Usage: g <query>";

module.cmd_gcalc = function cmd_gcalc(e) {
	var args = e.args;
	if (!args) {
		e.reply(this.cmd_gcalc.help);
		return true;
	}

	var page = e.bot.getHTTP(this.HUMAN_NOJS_SEARCH_BASE + encodeURIComponent(args), "google", this.version);
	if (this.CALC_REGEX.test(page)) {
		e.reply(this.cleanCalc(RegExp.$1));
	} else {
		e.reply("Couldn't grab a calculator result.");
	}
	return true;
};
module.cmd_gcalc.help = "Attempt to grab a Google Calculator result (from the no-JS results page). Usage: gcalc <query>";

module.cleanCalc = function cleanCalc(expr) {
	return decodeHTML(expr).replace("<sup>", "^(", "g").replace("</sup>", ")", "g");
};
