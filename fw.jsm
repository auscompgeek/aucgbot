// -*- Mode: JavaScript; tab-width: 4 -*- vim:tabstop=4 syntax=javascript:
/* fw.jsm - aucgbot module.exports - get the fucking weather
 * Copyright 2013, auscompgeek (auscompgeek.tk)
 * Copyright 2009-2013, Michael Yanovich (yanovich.net)
 * Licensed under the Eiffel Forum License 2.
 *
 * Stolen from jenni, hence the differing license.
 * https://github.com/myano/jenni/blob/master/modules/weather.py
 */
/*global module.exports: false */

module.exports.version = 0.1;
module.exports.BASE_URL = "http://thefuckingweather.com/?unit=c&where=";
// yes, I'm scraping HTML with regex. get over it.
module.exports.LOC_RE = /<span id="locationDisplaySpan" class="small">(.+?)<\/span>/;
module.exports.TEMP_RE = /<span class="temperature" tempf="(\d+)">(\d+)<\/span>/;
module.exports.COND_RE = /<p class="large specialCondition">(.+?)<\/p>/;
module.exports.REMARK_RE = /<p class="remark">(.+?)<\/p>/;
module.exports.FLAVOR_RE = /<p class="flavor">(.+?)<\/p>/;

module.exports.cmd_fw = function cmd_fw(e) {
	var args = e.args;
	if (!args) {
		e.reply(this.cmd_fw.help);
		return true;
	}

	var page = e.bot.readURI(this.BASE_URL + encodeURIComponent(args));
	if (!page) {
		e.reply("I CAN'T ACCESS THE FUCKING WEBSITE.");
		return true;
	}

	var res = "";
	if (this.LOC_RE.test(page)) {
		res += RegExp.$1 + ": ";
	}
	if (this.TEMP_RE.test(page)) {
		res += "{0}\xB0F!? {1}\xB0C!? ".format(RegExp.$1, RegExp.$2);
	}
	if (this.REMARK_RE.test(page)) {
		res += RegExp.$1;
	} else {
		res += "I CAN'T FIND THAT SHIT.";
	}
	if (this.COND_RE.test(page)) {
		res += " " + RegExp.$1;
	}
	if (this.FLAVOR_RE.test(page)) {
		res += " -- " + RegExp.$1;
	}

	e.reply(res);
	return true;
};
module.exports.cmd_fw.help = "Get the fucking weather. Usage: fw <location>";
