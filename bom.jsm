// -*- Mode: JavaScript; tab-width: 4 -*- vim:tabstop=4 syntax=javascript:
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
/*global Record: false, module: false */

(function(bom, fs, ini) {

bom.version = "1.0 (2015-08-24)";

bom.loadStateNames = function loadStateNames(state) {
	return ini.parse(fs.readFileSync('./bom_names.ini', 'utf-8'))[state.toLowerCase()];
};

bom.idToFwoJsonUrl = function idToFwoJsonUrl(id) {
	// BoM's JSON seems to be a bit much for JSDB to handle correctly, i.e. not load entirely
	var regionId = id.slice(0, id.indexOf("."));
	return "http://www.bom.gov.au/fwo/ID{0}/ID{1}.json".format(regionId, id);
};

bom.idToMinJsonUrl = function idToMinJsonUrl(id) {
	return "http://vovo.id.au/scripts/bommin.php?id={0.0}&wmo={0.1}".format(id.split("."));
};

bom.fullNameToName = function fullNameToName(name) {
	var station = name.split(" "), state = station.pop();
	return [station.join(" ").replace(/,$/, ""), state];
}

bom.nameToId = function nameToId(station, state) {
	var names = this.loadStateNames(state);
	return names[station];
};

bom.cmd_bom_id2fwo = function cmd_bom_id2fwo(e) {
	e.notice(this.idToFwoJsonUrl(e.args));
	return true;
};

bom.cmd_bom_name2id = function cmd_bom_name2id(e) {
	e.reply(this.nameToId.apply(this, this.fullNameToName(e.args)));
	return true;
};

bom.cmd_bom = function cmd_bom(e) {
	var args = e.args;
	if (!args) {
		e.reply(this.cmd_bom.help);
		return true;
	}

	var station = this.fullNameToName(args), state = station[1], stationId;
	station = station[0];
	stationId = this.nameToId(station, state);
	if (!stationId) {
		e.reply("Could not find station.");
		return true;
	}

	var data;
	try {
		data = e.bot.getJSON(this.idToMinJsonUrl(stationId), "bom", this.version);
	} catch (ex) {
		console.error(ex);
	}

	if (!data) {
		e.reply("BoM returned no data.");
		return true;
	}

	var res = [], temp = data.air_temp, hum = data.rel_hum, cloud = data.cloud, rain = data.rain_trace, wind = data.wind_spd_kmh, gust = data.gust_kmh;

	if (temp != null) {
		temp = "Temp: {0}\xB0C".format(temp);
		var appT = data.apparent_t;
		if (appT != null)
			temp += " (app: {0}\xB0C)".format(appT);
		res.push(temp);
	}

	if (hum)
		res.push("Humidity: {0}%".format(hum));

	if (cloud !== "-")
		res.push("Cloud: " + cloud);

	if (+rain)
		res.push("Rain (since 9am): {0} mm".format(rain));

	if (wind) {
		wind = "Wind: {0} km/h ({1} kt)".format(wind, data.wind_spd_kt);
		var windDir = data.wind_dir;
		if (windDir !== "-")
			wind += " " + windDir;
		res.push(wind);
	}

	if (gust)
		res.push("Gust: {0} km/h ({1} kt)".format(gust, data.gust_kt));

	e.nreply("Current weather for", data.name + ",", state.toUpperCase(), "from the Bureau of Meteorology (as of", data.local_date_time + "):", res.join(" - "));
	return true;
};
bom.cmd_bom.help = "Get current weather conditions from the Bureau of Meteorology. Usage: bom <station> <state>";

})(module.exports, require('fs'), require('ini'));
