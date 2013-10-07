// -*- Mode: JavaScript; tab-width: 4 -*- vim:tabstop=4 syntax=javascript:
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
/*global Stream: false, XML: false, aucgbot: false, module: false, system: false */
// Please don't use the included APPID in other applications.
// The default APPID is for personal/non-commercial use only.

module.version = 0.2;
module.APPID = "5d5102ff6928ac6e647092a502a2370d";
module.BASE_URL = "http://api.openweathermap.org/data/2.5/";
module.WEATHER_BASE_URL = module.BASE_URL + "weather?APPID=" + module.APPID + "&units=metric&q=";
module.FORECAST_BASE_URL = module.BASE_URL + "forecast?APPID=" + module.APPID + "&units=metric&q=";

module.cmd_weather = function cmd_weather(dest, args, nick, ident, host, conn, relay) {
	if (!args) {
		conn.reply(dest, nick, "Get current weather by city from OpenWeatherMap.");
		return true;
	}

	var data;
	try {
		data = aucgbot.getJSON(this.WEATHER_BASE_URL + encodeURIComponent(args), "weather", this.version);
	} catch (ex) {}

	if (!data) {
		conn.reply(dest, nick, "OpenWeatherMap returned no data.");
		return true;
	}

	if (data.cod != 200) {
		conn.reply(dest, nick, "OpenWeatherMap returned a", data.cod);
		return true;
	}

	conn.nmsg(dest, "Current weather in", data.name, "at", new Date(data.dt * 1000), "(from OpenWeatherMap):");

	var main = data.main, res = [];

	if (data.weather) {
		var weather = data.weather[0];  // why is this an array even?
		// perhaps put some other stuff in here as well
		if (weather.main)
			res.push(weather.main);
	}

	var temp = "Temp: {0} C".format(main.temp);
	if (main.temp_min && main.temp_max)
		temp += " (min: {0} C, max: {1} C)".format(main.temp_min, main.temp_max);
	res.push(temp);

	res.push("Humidity: {0}%".format(main.humidity));

	var hpa = main.pressure;
	if (hpa)
		res.push("Air pressure: {0} hPa".format(hpa));

	var wind = data.wind;
	if (wind && wind.speed)
		res.push("Wind: {0} m/s".format(wind.speed));

	var clouds = data.clouds;
	if (clouds && clouds.all)
		res.push("Clouds: {0}%".format(clouds.all))

	var rain = data.rain;
	if (rain && rain["3h"])
		res.push("Rain (3h): {0} mm".format(rain["3h"]));

	var snow = data.snow;
	if (snow && snow["3h"])
		res.push("Snow (3h): {0} mm".format(snow["3h"]));

	conn.nmsg(dest, res.join(" - "));

	return true;
};
