// -*- Mode: JavaScript; tab-width: 4 -*- vim:tabstop=4 syntax=javascript:
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
/*global module.exports: false */

module.exports.version = 0.8;
module.exports.BASE_URL = "http://tumbolia-two.appspot.com/";
module.exports.PY_BASE_URL = module.exports.BASE_URL + "py/";
module.exports.GENERAL_BASE_URL = module.exports.BASE_URL + "general/";
module.exports.TITLE_XPATH = "//x:title";

// evaluating Python from JS? what?
module.exports.cmd_py = function cmd_py(e) {
	var args = e.args;
	if (!args) {
		e.reply(this.cmd_py.help);
		return true;
	}

	e.reply(e.bot.getHTTP(this.PY_BASE_URL + encodeURIComponent(args), "oblique", this.version) || "No result.");
	return true;
};
module.exports.cmd_py.help = "Evaluate Python 2.7.5 using Google App Engine. Usage: py <expression>";

module.exports.cmd_wwwtitle = function cmd_wwwtitle(e) {
	var url = e.args.replace(/^htt?p?(s)?:?\/\/?/i, "http$1://"); // typo correction
	if (!url) {
		e.reply(this.cmd_wwwtitle.help);
		return true;
	}

	if (!url.startsWith("http")) {
		url = "http://" + url;
	}

	e.reply(e.bot.getHTTP(this.GENERAL_BASE_URL + escape(url) + encodeURI("||" + this.TITLE_XPATH)));
	return true;
};
module.exports.cmd_wwwtitle.help = "Attempt to grab the title of a webpage using XPath. Usage: wwwtitle <url>";

module.exports.cmd_oblique = function cmd_oblique(e) {
	var argv = e.args.split(" ");
	if (argv.length < 2) {
		e.reply(this.cmd_oblique.help);
		return true;
	}

	var service = argv.shift();
	e.reply(e.bot.getHTTP(this.BASE_URL + encodeURI(service) + "/" + encodeURIComponent(argv.join(" "))));
	return true;
};
module.exports.cmd_oblique.help = "Query an Oblique service. See https://github.com/nslater/oblique for details. Usage: oblique <service> <args>";
