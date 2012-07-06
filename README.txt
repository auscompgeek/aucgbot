This is auscompgeek's JavaScript IRC bot.
This bot is designed to be run with JSDB, found at http://jsdb.org/.
It is licensed under the Mozilla Public License v. 2.0, which can be
obtained at http://mozilla.org/MPL/2.0/.

Features:
  - General flood protection.
  - Logging.
  - Remote control.
  - Multi-server support.

Calculator features:
  - Error reporting.
  - Dice.
  - Temperature conversion.

Basic usage:
	run("aucgbot.js");
	aucgbot.prefs[pref] = setting;
	aucgbot.start([hostname, port, nick, ident, pass, channels]...);
The above can be run from a script, not just from a jsdb prompt.
I don't recommend storing passwords on disk however.
Running ./start-aucgbot will prompt for each server property.