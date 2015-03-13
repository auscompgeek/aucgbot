// -*- Mode: JavaScript; tab-width: 4 -*- vim:tabstop=4 syntax=javascript:
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
/*global XML: false, module: false */
// Please don't use the included AppID in other applications.
// The default AppID is for personal/non-commercial use only.
// Note: E4X is horrible and has been deprecated in newer versions of SpiderMonkey.

module.version = 0.8;
module.QUERY_BASE_URL = "http://api.wolframalpha.com/v2/query?format=plaintext&reinterpret=true&appid=XX49X9-5GAP7JVXWA&input=";

module.cmd_wa = function cmd_wa(e) {
	var args = e.args;
	if (!args) {
		e.reply(this.cmd_wa.help);
		return true;
	}

	var queryresult = e.bot.getXML(this.QUERY_BASE_URL + encodeURIComponent(args), "wa", this.version); // not JSON q_q

	if (!queryresult) {
		e.reply("Wolfram|Alpha returned no data.");
		return true;
	}

	var pods = queryresult.pod, input = String(pods.(@id == "Input").subpod.plaintext), result;
	pods = pods.(@id != "Plot" && @error == "false");

	for (let i = 0, pod, subpods, plaintext; pod = pods[i]; i++) {
		if (pod.@primary == "true") {
			subpods = pod.subpod;
			plaintext = subpods[0].plaintext;
			if (plaintext) {
				if (plaintext == input) {
					input = null;
				}
				result = pod.@title + ": " + plaintext;
				break;
			}
		}
	}

	if (result) {
		if (input) {
			e.reply(input, "-", result);
		} else {
			e.reply(result);
		}
	} else {
		e.reply("Couldn't grab a result.");
	}

	return true;
};
module.cmd_wa.help = "Get the primary result for a Wolfram|Alpha query. Usage: wa <input>";
