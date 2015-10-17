// -*- Mode: JavaScript; tab-width: 4 -*- vim:tabstop=4 syntax=javascript:
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
/*global module.exports: false */

module.exports.version = 0.4;
module.exports.BASE_URL = "https://isitup.org/{0}.json";

module.exports.cmd_isitup = function cmd_isitup(e) {
	var domain = e.args.replace(/https?:\/\/|\/.*/g, "");
	if (!domain) {
		e.reply(this.cmd_isitup.help);
		return true;
	}

	// assume a .com domain if there's no .
	if (!domain.includes(".")) {
		domain += ".com";
	}

	var data;
	try {
		data = e.bot.getJSON(this.BASE_URL.format(domain), "isitup", this.version);
	} catch (ex) {}

	if (!data) {
		e.reply("Is it up? returned no data.");
		return true;
	}

	var status, statusCode = data.status_code;
	if (statusCode === 1) {
		status = "up. It took {response_time} seconds to get a {response_code} response from {response_ip}.".format(data);
	} else if (statusCode === 2) {
		status = "down.";
	} else if (statusCode === 3) {
		status = "an invalid domain.";
	} else {
		status = "unknown.";
	}

	e.reply(data.domain, "is", status);

	return true;
};
module.exports.cmd_isitup.help = "Is a website up? Queries isitup.org. Usage: isitup <domain>";
