// -*- Mode: JavaScript; tab-width: 4 -*- vim:tabstop=4 syntax=javascript:
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

module.version = "0.2.3 (8 Mar 2012)";
//module.prefs = { internal: true }
if (!aucgbot.pin)
{	aucgbot.pin = system.safeMode();
	system.safeMode(aucgbot.pin);
}

module.cmd_js =
function cmd_js(dest, msg, nick, host, at, serv, relay)
{	var ret; system.safeMode()
	try
	{	let aucgbot = undefined;
		let system = undefined;
		let pin = undefined;
		ret = eval(msg);
	} catch (ex) { aucgbot.msg(dest, at + "uncaught exception:", ex) }
	system.safeMode(aucgbot.pin);
	if (ret)
	{	if (typeof ret == "function")
			aucgbot.msg(dest, at + "(function)");
		else
			aucgbot.msg(dest, at + typeof ret, JSON.stringify(ret));
	}
	return true;
}