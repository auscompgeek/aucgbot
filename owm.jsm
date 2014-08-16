// -*- Mode: JavaScript; tab-width: 4 -*- vim:tabstop=4 syntax=javascript:
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
/*global Stream: false, XML: false, aucgbot: false, module: false, system: false */
// Please don't use the included APPID in other applications.
// The default APPID is for personal/non-commercial use only.

module.version = 0.6;
module.APPID = "5d5102ff6928ac6e647092a502a2370d";
module.BASE_URL = "http://api.openweathermap.org/data/2.5/";
module.WEATHER_BASE_URL = module.BASE_URL + "weather?units=metric&q=";
module.FORECAST_BASE_URL = module.BASE_URL + "forecast?units=metric&q=";

module.cmd_weather = module.cmd_owm = function cmd_owm(e) {
	var dest = e.dest, args = e.args, nick = e.nick, conn = e.conn;
	if (!args) {
		conn.reply(dest, nick, this.cmd_owm.help);
		return true;
	}

	var data;
	try {
		data = aucgbot.getJSON(this.WEATHER_BASE_URL + encodeURIComponent(args), "owm", this.version, {"X-API-Key": module.APPID});
	} catch (ex) {}

	if (!data) {
		conn.reply(dest, nick, "OpenWeatherMap returned no data.");
		return true;
	}

	if (data.cod != 200) {
		conn.reply(dest, nick, "OpenWeatherMap returned a", data.cod);
		return true;
	}

	var main = data.main, res = [], hpa = main.pressure, wind = data.wind, clouds = data.clouds, rain = data.rain, snow = data.snow;

	if (data.weather) {
		var weather = data.weather[0];  // why is this an array even?
		// perhaps put some other stuff in here as well
		if (weather.main)
			res.push(weather.main);
	}

	var temp = "Temp: {0}\xB0C".format(main.temp);
	if (main.temp_min && main.temp_max)
		temp += " (min: {0}\xB0C, max: {1}\xB0C)".format(main.temp_min, main.temp_max);
	res.push(temp);

	res.push("Humidity: {0}%".format(main.humidity));

	if (hpa)
		res.push("Air pressure: {0} hPa".format(hpa));

	if (wind && wind.speed)
		res.push("Wind: {0} m/s".format(wind.speed));

	if (clouds && clouds.all)
		res.push("Clouds: {0}%".format(clouds.all))

	if (rain && rain["3h"])
		res.push("Rain (3h): {0} mm".format(rain["3h"]));

	if (snow && snow["3h"])
		res.push("Snow (3h): {0} mm".format(snow["3h"]));

	e.nreply("Current weather for", data.name, "from OpenWeatherMap (as of", new Date(data.dt * 1000) + "):", res.join(" - "));
	return true;
};
module.cmd_owm.help = "Get the current weather from OpenWeatherMap. Usage: owm <location>";
