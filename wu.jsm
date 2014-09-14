// -*- Mode: JavaScript; tab-width: 4 -*- vim:tabstop=4 syntax=javascript:
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
/*global module.exports: false */
// Please don't use the included API key in other applications.
// The default API key is for personal/non-commercial use only.

module.exports.version = 0.8;
module.exports.API_KEY = "bb7ba883f6b6aea5";
module.exports.BASE_URL = "http://api.wunderground.com/api/" + module.exports.API_KEY;
module.exports.COND_BASE_URL = module.exports.BASE_URL + "/conditions/q/";
// forecast doesn't return the location
module.exports.FORECAST_BASE_URL = module.exports.BASE_URL + "/geolookup/forecast/q/";

module.exports.cmd_weather = module.exports.cmd_wu = module.exports.cmd_wunderground = function cmd_wu(e) {
	var args = e.args;
	if (!args) {
		e.reply(this.cmd_wu.help);
		return true;
	}

	var data;
	try {
		data = e.bot.getJSON(this.COND_BASE_URL + encodeURI(args) + ".json", "wu", this.version);
	} catch (ex) {}

	if (!data) {
		e.reply("Weather Underground returned no data.");
		return true;
	}

	var error = data.response.error;
	if (error) {
		e.nreply(error.type + ":", error.description);
		return true;
	}

	var results = data.response.results;
	if (results) {
		var names = results.map(function (loc) { return "{city}, {state}, {country}".format(loc); });
		e.nreply(results.length, "locations matched your query:", names.join(" - "));
		return true;
	}

	var curr = data.current_observation, res = [curr.weather];

	res.push("Temp: " + curr.temperature_string);
	res.push("Humidity: " + curr.relative_humidity);
	res.push("Wind: " + curr.wind_string);
	res.push("Rainfall today: " + curr.precip_today_string);
	res.push("UV: " + curr.UV);

	e.nreply("Current weather for", curr.display_location.full, "from Weather Underground (" + curr.observation_time + "):", res.join(" - "));
	return true;
};
module.exports.cmd_wu.help = "Get current weather conditions from Weather Underground.";

module.exports.cmd_forecast = module.exports.cmd_wu_forecast = function cmd_wu_forecast(e) {
	var args = e.args;
	if (!args) {
		e.reply(this.cmd_wu_forecast.help);
		return true;
	}

	var data;
	try {
		data = e.bot.getJSON(this.FORECAST_BASE_URL + encodeURI(args) + ".json", "wu", this.version);
	} catch (ex) {}

	if (!data) {
		e.reply("Weather Underground returned no data.");
		return true;
	}

	var error = data.response.error;
	if (error) {
		e.nreply(error.type + ":", error.description);
		return true;
	}

	var results = data.response.results;
	if (results) {
		var names = results.map(function (loc) { return "{city}, {state}, {country}".format(loc); });
		e.nreply(results.length, "locations matched your query:", names.join(" - "));
		return true;
	}

	var loc = data.location, f0 = data.forecast.txt_forecast.forecastday[0];

	e.nreply(f0.title, "weather forecast for", "{city}, {state}, {country}".format(loc), "from Weather Underground:", f0.fcttext_metric);

	return true;
};
module.exports.cmd_wu_forecast.help = "Get weather forecast from Weather Underground.";
