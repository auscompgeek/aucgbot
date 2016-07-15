(function (self, urllib) {
"use strict";

self.version = 0.3;

self.SEARCH_API_BASE = "https://bingapis.azure-api.net/api/v5/search?count=1&responseFilter=Webpages,Computation,SpellSuggestions";
self.SEARCH_API_KEY = "f23772392e714c178d44844e42a7c40e";

self.cmd_b = self.cmd_bing = function cmd_bing(e) {
	var args = e.args;
	if (!args) {
		e.reply(cmd_bing.help);
		return true;
	}

	var url = self.SEARCH_API_BASE;
	if (!e.preferNoColour) {
		url += "&textDecorations=true";
	}
	url += "&q=" + encodeURIComponent(args);

	var res;
	try {
		res = e.bot.getJSON(url, "bing", self.version, {
			"Ocp-Apim-Subscription-Key": self.SEARCH_API_KEY,
		});
	} catch (ex) {}

	if (!res) {
		e.reply("Bing returned no data.");
		return true;
	}

	if ("spellSuggestions" in res) {
		let query = res.spellSuggestions.value[0];
		let text = e.preferNoColour ? query.text : boldify(query.displayText);
		e.reply(`Did you mean: ${text}?`);
	} else if ("queryContext" in res) {
		e.reply("Assuming you meant:", res.queryContext.alteredQuery);
	}

	if ("computation" in res) {
		e.reply(res.computation.expression, "=", res.computation.value);
	} else if ("webPages" in res) {
		let page = res.webPages.value[0];
		let name = page.name, snippet = page.snippet, url = page.displayUrl;

		if (url.includes("...")) {
			// possibly truncated url, parse the bing redirect url
			url = urllib.parse(page.url, true).query.r;
		} else {
			if (!url.includes("://")) {
				url = "http://" + url;
			}
			if (!e.preferNoColour) {
				url = boldify(url);
			}
		}

		if (!e.preferNoColour) {
			name = boldify(name);
			snippet = boldify(snippet);
		}
		e.reply(url, "-", name, "-", snippet);
	} else {
		e.reply("No results.");
	}

	return true;
};
self.cmd_bing.help = "Query Bing. Returns computation results if any. Usage: bing <query>";

function boldify(text) {
	return text.replace(/[\ue000\ue001]/g, "\x02");
}

})(exports, require("url"));

// vim:ft=javascript:
