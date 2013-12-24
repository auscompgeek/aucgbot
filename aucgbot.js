// -*- Mode: JavaScript; tab-width: 4 -*- vim:tabstop=4:
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * @fileoverview
 * aucgbot: an IRC bot written in JS.
 * Designed to be run using <a href="http://jsdb.org">JSDB</a>.
 *
 * Features:
 * <ul>
 * <li>General flood protection.</li>
 * <li>Logging.</li>
 * <li>Remote control.</li>
 * </ul>
 *
 * Usage:
 * <ul>
 * <li>run("aucgbot.js");</li>
 * <li>aucgbot.prefs[pref] = setting;</li>
 * <li>aucgbot.start([hostname, port, nick, ident, pass, channels]...);</li>
 * </ul>
 */

/*jshint boss: true, es5: true, esnext: true, eqnull: true, evil: true, expr: true, forin: true, regexdash: true, indent: 1, white: false */
/*global Stream: false, decodeUTF8: false, encodeB64: false, readln: false, run: false, sleep: false, system: false, writeln: false,
	aucgbot: true, global: true, module: true, randint: true */

// https://github.com/tracker1/core-js/blob/master/js-extensions/100-String.format.js
// loading this here so we can use it to format the useragent
load("String.format.js");

var aucgbot = aucgbot || {
	ERR_MSG_SELF: "Get me to talk to myself, yeah, great idea...",
	prefs: {
		flood: {
			lines: 8,
			secs: 3,
			check: true,
			log: true,
			kick: true, // not if message was relayed
			ban: false, // during flood
			warn: false // warn user sending message in PM when flood starts
		},
		readDelay: 150, // delay on readURI()
		log: true, // toggle all logging
		prefix: "]", // command prefix
		zncBufferHacks: true, // use ZNC buffer hacks
		zncBufferTSHack: false, // use ZNC buffer timestamps hack
		autoAcceptInvite: true, // automatically join on invite
		"relay.check": true, // toggle relay bot checking
		"relay.bots": ["iRelayer", "janus", "Mingbeast", "irfail", "rbot"],
		/** @deprecated */ "keyboard.sendInput": false, // keyboard.dieOnInput must be false
		"keyboard.evalInput": false, // keyboard.dieOnInput must be false
		"keyboard.dieOnInput": false, // overrides keyboard.sendInput and keyboard.evalInput
		"kick.rejoin": false,
		"kick.log": true, // on bot kicked
		// RegExps to not ban/kick nicks/hosts
		"nokick.nicks": /Tanner|Mardeg|aj00200|ChrisMorgan|JohnTHaller|Bensawsome|juju|Shadow|TMZ|aus?c(ompgeek|g|ow)|janb|Peng|TFEF|Nightmare/,
		"nokick.hosts": /botters|staff|dev|math|javascript/,
		bots: ["PaperBag"], // bot nicks that don't match the bot regex
		suDests: [],
		// regex for allowed hosts to use rc command
		suHosts: /aucg|auscompgeek|^(?:freenode\/|)(?:staff|dev)|botters|^(?:127\.\d+\.\d+\.\d+|localhost(?:\.localdomain)?)$/
	},
	//cmodes: {}, // TODO Parse MODE lines.
	modules: {},
	conns: []
};
aucgbot.version = "5.4 (2013-12-24)";
aucgbot.source = "https://github.com/auscompgeek/aucgbot";
aucgbot.useragent = "aucgbot/{0} (+{1}; {2}; JSDB {3})".format(aucgbot.version, aucgbot.source, system.platform, system.release);
global = this;

/**
 * Start the bot. Each argument is to be passed as arguments to {@link aucgbot#connect}.
 *
 * @usage aucgbot.start([hostname, port, nick, ident, pass, channels]...);
 */
aucgbot.start = function startBot() {
	var args = Array.slice(arguments);
	while (args.length)
		this.connect.apply(this, args.shift());
	args = null;
	this.started = Date.now();
	this.startLoop();
};
/**
 * Connect the bot. All arguments are optional.
 *
 * @param {string} [host] The hostname to connect to (default: 127.0.0.1).
 * @param {number} [port] The port to connect to (default: 6667).
 * @param {string} [nick] Nick to use (default: aucgbot).
 * @param {string} [ident] Ident to use (default: aucgbot).
 * @param {string} [pass] The server password to use, if any.
 * @param {string|string[]} [chans] Channels to join on connect (default: #bots).
 * @see aucgbot#start
 */
aucgbot.connect = function connectBot(host, port, nick, ident, pass, chans, sasluser, saslpass) {
	var channels = ["#bots"], conn = new this.IRCStream(host, port), ln;

	if (pass) {
		conn.send("PASS", pass);
		pass = null;
	}

	if (sasluser && saslpass) {
		conn.send("CAP REQ sasl");
		while ((ln = conn.readln().trim())) {
			writeln(conn.addr, ": ", ln);
			if (ln === "AUTHENTICATE +")
				conn.send("AUTHENTICATE", encodeB64(sasluser + "\0" + sasluser + "\0" + saslpass));
			else if (/^:\S+ CAP \* ACK :sasl/.test(ln))
				conn.send("AUTHENTICATE PLAIN");
			else if (/^:\S+ 90([345]) ./.test(ln)) {
				conn.send("CAP END");
				if (RegExp.$1 !== "3") {
					conn.send("QUIT");
					conn.close();
					return;
				}
				break;
			}
		}
	}

	conn.send("NICK", conn.nick = nick || "aucgbot");
	conn.send("USER", ident || "aucgbot", "8 * :\x033\x0fauscompgeek's JS bot");

	if (chans) {
		if (chans instanceof Array)
			channels = chans;
		else if (typeof chans === "string")
			channels = chans.split(",");
		else
			writeln("[WARNING] Can't join channels specified! Joining ", channels);
	} else {
		writeln("[WARNING] No channels specified! Joining ", channels);
	}
	chans = null;

	while ((ln = conn.readln().trim())) {
		writeln(conn.addr, ": ", ln);
		if (/^PING (.+)/.test(ln))
			conn.send("PONG", RegExp.$1);
		else if (/^:\S+ 433 ./.test(ln))
			conn.send("NICK", conn.nick += "_");
		else if (/^:\S+ 003 ./.test(ln)) {
			if (channels) {
				conn.send("JOIN", ":" + channels.map(function (chan) conn.chantypes.contains(chan[0]) ? chan : "#" + chan).join(","));
				channels = null;
			}
			break;
		}
	}

	conn.flood_lines = 0;
	this.conns.push(conn);
	system.gc();
};
/**
 * Start the server read line loop.
 *
 * @see aucgbot#start
 */
aucgbot.startLoop = function startLoop() {
	while (this.conns.length) {
		system.wait(this.conns, 36000);

		for (var i = this.conns.length - 1, conn; conn = this.conns[i]; i--) {
			if (conn.canRead) {
				this.parseln(conn.readln().trim(), conn);
				if (system.kbhit()) {
					if (this.prefs["keyboard.dieOnInput"])
						conn.send("QUIT :Keyboard input.");
					else if (this.prefs["keyboard.evalInput"])
						eval(readln());
					else if (this.prefs["keyboard.sendInput"])
						conn.send(readln());
				}
			}

			if (conn.eof)
				this.cleanConn(i);
		}
	}
};
/**
 * Clean up a server connection.
 *
 * @param {number} i The index of the connection.
 */
aucgbot.cleanConn = function cleanConn(i) {
	this.conns[i].close();
	if (i === this.conns.length - 1)
		this.conns.length--;
	else if (!i)
		this.conns.shift();
	else
		this.conns.splice(i, 1);
	system.gc();
};

/**
 * Parse a raw IRC line after a successful login.
 * Modules can listen for events here through the parseln and onNick methods.
 *
 * @param {string} ln Raw IRC line.
 * @param {Stream} conn Server connection.
 */
aucgbot.parseln = function parseln(ln, conn) { // TODO parse IRC quoting
	if (/^\s*$/.test(ln)) // for weird servers
		return;
	try { ln = decodeUTF8(ln); } catch (ex) {}
	writeln(conn.addr, ": ", ln);

	if (this.modMethod("parseln", arguments))
		return;

	var msgary = /^:([^\s!@]+)!([^\s!@]+)@([^\s!@]+) PRIVMSG (\S+) :(.*)/.exec(ln);
	if (msgary) {
		let e = new this.Message(conn, msgary);
		msgary = null;
		this.onMsg(e);
		e = null;
		system.gc();
	} else if (/^PING (.+)/.test(ln)) {
		conn.send("PONG", RegExp.$1);
	} else if (/^:([^\s!@]+![^\s!@]+@[^\s!@]+) INVITE \S+ :(\S+)/.test(ln)) {
		this.log(conn, "INVITE", RegExp.$1, RegExp.$2);
		if (this.prefs.autoAcceptInvite)
			conn.send("JOIN", RegExp.$2);
	} else if (/^:([^\s!@]+)!([^\s!@]+)@([^\s!@]+) NICK :(\S+)/.test(ln)) {
		if (RegExp.$1 === conn.nick)
			conn.nick = RegExp.$4;
		else
			this.modMethod("onNick", [{conn: conn, oldNick: RegExp.$1, newNick: RegExp.$4, ident: RegExp.$2, host: RegExp.$3, ln: ln}]);
	//} else if (/^:([^\s!@]+)(?:!([^\s!@]+)@([^\s!@]+)|) MODE (\S+) ((?:[+\-][A-Za-z]+)+)/.test(ln)) {
		// TODO parse MODE lines
	} else if (/^:([^\s!@]+![^\s!@]+@[^\s!@]+) KICK (\S+) (\S+) :(.*)/.test(ln)) {
		if (RegExp.$3 === conn.nick) {
			if (this.prefs["kick.rejoin"])
				conn.send("JOIN", RegExp.$2);
			if (this.prefs["kick.log"])
				this.log(conn, "KICK", RegExp.$1, RegExp.$2, RegExp.$4);
		}
	}
};

/**
 * Parse a PRIVMSG. Modules can listen for events through the onMsg method, fired before CTCP and
 * command handling but after the ZNC buffer and relay bot hacks, and bot and flood checking.
 *
 * @param {string} dest Channel or nick to send messages back.
 * @param {string} msg The message.
 * @param {string} nick Nick that sent the PRIVMSG.
 * @param {string} ident User's ident.
 * @param {string} host Hostname that sent the PRIVMSG.
 * @param {Stream} conn Server connection.
 */
aucgbot.onMsg = function onMsg(e) {
	var conn = e.conn, nick = e.nick;

	// fix for buffer playback on ZNC
	if (this.prefs.zncBufferHacks) {
		if (conn.zncBuffer && this.prefs.zncBufferTSHack)
			e.msg = e.msg.replace(/^\[[0-2]?\d:[0-5]\d(?::[0-5]\d|)\] /, "");
		else if (nick === "***") {
			if (e.msg === "Buffer playback...")
				conn.zncBuffer = true;
			else if (e.msg === "Playback complete")
				delete conn.zncBuffer;
			return;
		}
	}

	var meping = RegExp("^@?" + conn.nick.replace(/\W/g, "\\$&") + "[:,] ?", "i"), dest = e.dest, host = e.host;

	// fix for message relay bots
	if (this.prefs["relay.check"] && this.prefs["relay.bots"].contains(nick)) {
		if (/^\* (\S+) (.+)/.test(msg)) {
			e.relay = e.nick, nick = e.nick = RegExp.$1.replace(/^(?:\[\w+\]|\w+:)|\/.+/g, ""), e.msg = RegExp.$2;
			if (!e.nick && /^(\S+) (.+)/.test(e.msg))
				e.nick = RegExp.$1, e.msg = RegExp.$2;
			if (!this.checkFlood(e))
				this.modMethod("onAction", [e]);
			return;
		}
		if (/^<([^>]+)> (.+)/.test(msg))
			e.msg = RegExp.$2, e.relay = nick, nick = e.nick = RegExp.$1.replace(/^(?:\[\w+\]\s*|\w+:)|\/.+/g, "");
	}

	// don't listen to bots
	if (((/bot[\d_|]*$|Serv|^bot|Op$/i.test(nick) || this.prefs.bots.contains(nick)) && nick !== conn.nick) || (host.contains("/bot/") && !e.relay))
		return;

	// flood protection
	if (this.checkFlood(e))
		return;

	var msg = (e.msg = e.msg.replace(/\s+/g, " "));

	try {
		if (this.modMethod("onMsg", [e]))
			return;
	} catch (ex) {
		e.logError("onMsg", ex, nick + (dest === nick ? "" : " in " + dest), msg);
	}

	if (!e.relay && msg[0] === "\x01") {
		// Possible CTCP.
		if (/^\x01([^\1 ]+)(?: ([^\1]*)|)\x01$/.test(msg)) {
			// TODO parse CTCP \x01 quoting
			e.ctcpType = RegExp.$1, e.msg = RegExp.$2;
			this.onCTCP(e);
		}
		return;
	}

	var prefix = this.prefs.prefix;
	if (prefix && msg.slice(0, prefix.length) === prefix) {
		e.args = msg.slice(prefix.length).replace(/^(\S+) ?/, "");
		e.cmd = RegExp.$1.toLowerCase();
		this.parseCmd(e);
	} else if (meping.test(msg) || dest === nick) {
		e.args = msg.replace(meping, "").replace(/^(\S+) ?/, "");
		e.cmd = RegExp.$1.toLowerCase();
		this.parseCmd(e);
	} else {
		try {
			this.modMethod("onUnknownMsg", [e]);
		} catch (ex) {
			e.logError("onUnknownMsg", ex, nick + (dest === nick ? "" : " in " + dest), msg);
		}
	}
};
/**
 * Ensure that a message isn't part of a flood.
 *
 * @param {string} dest Channel or nick to send messages back.
 * @param {string} msg The message.
 * @param {string} nick Nick that sent the PRIVMSG.
 * @param {string} host Hostname that sent the PRIVMSG.
 * @param {Stream} conn Server connection.
 * @param {string} relay Relay bot nick or "".
 * @return {boolean} true if message is part of a flood.
 */
aucgbot.checkFlood = function checkFlood(e) {
	/* TODO Implement this fully. *
	 * Don't try to kick/ban if:
	 *	a) we're not in a channel,
	 *	b) the message was from us
	 *	c) the user matches one of the nokick/superuser prefs
	 *	d) the user in question has any cmodes set *
	 *	e) we don't have any cmodes set on us or *
	 *	f) the message was sent by a relay bot.
	 */
	if (!this.prefs.flood.check || e.conn.zncBuffer)
		return false;
	var now = Date.now(), conn = e.conn, dest = e.dest, nick = e.nick, host = e.host, relay = e.relay, msg = e.msg;
	if (now - conn.flood_lastTime > this.prefs.flood.secs * 1000)
		conn.flood_lines = 0;
	if (conn.flood_lines >= this.prefs.flood.lines && now - conn.flood_lastTime <= this.prefs.flood.secs * 1000) {
		var kb = this.okToKick(e);
		conn.flood_lastTime = now;
		if (conn.flood_in) {
			if (kb) {
				if (this.prefs.flood.kick)
					conn.send("KICK", dest, nick, ":No flooding!");
				if (this.prefs.flood.ban)
					conn.send("MODE", dest, "+b *!*@" + host);
			}
		} else {
			conn.flood_in = true;
			writeln("[WARNING] Flood detected!");
			if (kb && this.prefs.flood.kick)
				conn.send("KICK", dest, nick, ":No flooding!");
			else if (this.prefs.flood.warn && !relay)
				conn.notice(nick, "Please don't flood.");
		}
		if (this.prefs.flood.log)
			e.log("Flood", nick + (dest === nick ? "" : " in " + dest), msg);
		return true;
	}
	conn.flood_in = false, conn.flood_lastTime = now, conn.flood_lines++;
	return false;
};
/**
 * Parse a command filtered by onMsg(). Methods can listen here through the parseCmd and cmd_* methods.
 *
 * @param {string} dest Channel or nick to send messages back.
 * @param {string} cmd Command name.
 * @param {string} args Any arguments.
 * @param {string} nick Nick that sent the PRIVMSG.
 * @param {string} ident User's ident.
 * @param {string} host Hostname that sent the PRIVMSG.
 * @param {Stream} conn Server connection.
 * @param {string} relay Relay bot nick or "".
 */
aucgbot.parseCmd = function parseCmd(e) {
	var dest = e.dest, cmd = e.cmd, args = e.args, nick = e.nick, host = e.host, conn = e.conn, relay = e.relay;
	switch (cmd) {
	case "ping":
		e.reply("pong", args);
		break;
	case "version":
		e.reply("aucgbot", this.version);
		break;
	case "source":
		e.reply(this.source);
		break;
	case "rc":
		args = args.split(" ");
		if (this.isSU(e)) {
			e.rcCmd = args.shift();
			e.args = args;
			this.remoteControl(e);
		} else {
			e.log("RC ATTEMPT", nick + (relay && ":" + relay) + "!" + e.ident + "@" + host + (dest === nick ? "" : " in " + dest), args.join(" "));
		}
		break;
	case "status": case "uptime":
		e.reply("Uptime:", this.up());
		break;
	case "listmods": case "modlist":
		var mods = [];
		for (var i in this.modules) {
			if (this.modules.hasOwnProperty(i))
				mods.push(i + " " + this.modules[i].version);
		}
		if (mods.length)
			e.notice(mods.join(", "));
		break;
	case "help":
		if (args) {
			var c = args, k = "cmd_" + c;
			for (var m in this.modules) {
				if (this.modules.hasOwnProperty(m)) {
					var module = this.modules[m];
					if (module.hasOwnProperty(k)) {
						var h = module[k].help;
						if (h)
							e.reply(c, "(" + m + "):", h);
						else
							e.reply(c, "(" + m + ") has no help.");
						break;
					}
				}
			}
			break;
		}
		/* fallthrough */
	case "listcmds": case "cmdlist":
		var s = [];
		for (var m in this.modules) {
			if (this.modules.hasOwnProperty(m)) {
				for (var p in this.modules[m]) {
					if (this.modules[m].hasOwnProperty(p) && p.slice(0, 4) === "cmd_")
						s.push(p.slice(4));
				}
			}
		}
		if (s.length > 1)
			e.notice(s.join(" "));
		break;
	default:
		try {
			this.modMethod("parseCmd", arguments) || this.modMethod("cmd_" + cmd, arguments);
		} catch (ex) {
			e.notice("Oops, I encountered an error.", ex);
			e.logError("command", ex, nick + (dest === nick ? "" : " in " + dest), cmd, args);
		}
	}
};
/**
 * Get the uptime of the bot.
 *
 * @author Ogmios
 * @return {string} Uptime in human readable format.
 */
aucgbot.up = function uptime() {
	if (!this.started)
		return;
	var diff = Math.round((Date.now() - this.started) / 1000),
		s = diff % 60, m = (diff % 3600 - s) / 60,
		h = Math.floor(diff / 3600) % 24, d = Math.floor(diff / 86400);
	return (d ? d + "d " : "") + (h ? h + "h " : "") + (m ? m + "min " : "") + (s ? s + "s" : "");
};
/**
 * Parse a CTCP request. Modules can listen for events here through the onAction, onUnknownCTCP, and (deprecated) onCTCP methods.
 *
 * @param {string} type CTCP request type.
 * @param {string} msg Any arguments.
 * @param {string} nick Nick of the requestee.
 * @param {string} dest Channel to which the request was sent (`nick` if sent in PM).
 * @param {Stream} conn Server connection.
 */
aucgbot.onCTCP = function onCTCP(e) {
	var type = e.ctcpType, msg = e.msg, nick = e.nick, dest = e.dest, conn = e.conn;
	// onCTCP in modules is deprecated in favour of onAction and onUnknownCTCP
	try {
		if (this.modMethod("onCTCP", arguments))
			return;
	} catch (ex) {
		e.logError("onCTCP", ex, nick + (dest === nick ? "" : " in " + dest), type, msg);
	}
	function nctcp(res) {
		e.notice("\x01" + type, res + "\x01");
	}
	switch (type.toUpperCase()) {
	case "PING":
		nctcp(msg);
		break;
	case "ACTION":
		try {
			this.modMethod("onAction", arguments);
		} catch (ex) {
			e.logError("onAction", ex, nick + (dest === nick ? "" : " in " + dest), type, msg);
		}
		break;
	case "VERSION":
		nctcp("aucgbot {0} (JSDB {1}, JS {2}, {3})".format(this.version, system.release, system.version / 100, system.platform));
		break;
	case "TIME":
		nctcp(Date()); // little known fact: Date returns a string when not called as a constructor
		break;
	case "SOURCE": case "URL":
		nctcp(this.source);
		break;
	case "PREFIX":
		nctcp(this.prefs.prefix);
		break;
	case "UPTIME": case "AGE":
		nctcp(this.up());
		break;
	case "GENDER": case "SEX":
		nctcp("bot");
		break;
	case "LOCATION":
		nctcp("behind you");
		break;
	case "A/S/L": case "ASL":
		nctcp("2/bot/behind you");
		break;
	case "AVATAR": case "ICON": case "FACE":
		//nctcp(""); -- Donations accepted
		break;
	case "LANGUAGES": case "LANGUAGE":
		nctcp("JS,en");
		break;
	default:
		try {
			if (this.modMethod("onUnknownCTCP", arguments))
				break;
		} catch (ex) {
			e.logError("onUnknownCTCP", ex, nick + (dest === nick ? "" : " in " + dest), type, msg);
		}
		writeln("[WARNING] Unknown CTCP! ^^^^^");
		e.log("CTCP", nick + (nick === dest ? "" : " in " + dest), type, msg);
	}
};
/**
 * Parses a control signal from a user with remote control privileges.
 * Modules can listen for events here through the remoteControl method.
 *
 * @param {string} cmd Command name.
 * @param {string} args Any arguments.
 * @param {string} dest Channel or nick to send messages back.
 * @param {string} nick Nick that sent the signal.
 * @param {Stream} conn Server connection.
 */
aucgbot.remoteControl = function rcBot(e) {
	var cmd = e.rcCmd, args = e.args, dest = e.dest, nick = e.nick, conn = e.conn;
	if (cmd !== "log")
		e.log("RC", nick + (dest === nick ? "" : " in " + dest), cmd, args.join(" "));
	switch (cmd) {
	case "self-destruct": // Hehe, I had to put this in :D
	case "explode":
		conn.send("QUIT :" + nick + ": 10... 9... 8... 7... 6... 5... 4... 3... 2... 1... 0... *boom*", args.join(" "));
		break;
	case "die":
		conn.send("QUIT :" + nick + ":", args.join(" "));
		break;
	case "join":
		var chans = args.shift().split(",");
		for (var i = chans.length - 1; i >= 0; i--) {
			if (!conn.chantypes.contains(chans[i][0]))
				chans[i] = "#" + chans[i];
		}
		conn.send("JOIN", chans.join(","), args.join(" "));
		break;
	case "leave":
		var chans = args.shift().split(",");
		for (var i = chans.length - 1; i >= 0; i--) {
			if (!conn.chantypes.contains(chans[i][0]))
				chans[i] = "#" + chans[i];
		}
		conn.send("PART", chans.join(","), ":" + nick + ":", args.join(" "));
		break;
	case "kick":
		var chan = args.shift(), user = args.shift();
		if (user === conn.nick) {
			e.reply("Get me to kick myself, yeah, great idea...");
			break;
		}
		if (!conn.chantypes.contains(chan[0]))
			chan = "#" + chan;
		conn.send("KICK", chan, user, ":" + nick + ":", args.join(" "));
		break;
	case "msg": case "privmsg": case "message":
		if (args[0] === conn.nick) {
			e.reply(this.ERR_MSG_SELF);
			break;
		}
		conn.msg.apply(conn, args);
		break;
	case "echo": case "say":
		e.send(args.join(" "));
		break;
	case "quote": case "raw":
		conn.send(args.join(" "));
		break;
	case "eval": case "js": // Dangerous!
		args = args.join(" ");
		var res;
		try { res = eval(args); } catch (ex) { res = "exception: " + ex; }
		if (typeof res === "function")
			res = "function " + res.name;
		if (res != null)
			e.reply(res);
		break;
	case "pref":
		e.notice("Not implemented.");
		break;
	case "log":
		e.log("LOG", nick + (dest === nick ? "" : " in " + dest), args.join(" "));
		break;
	case "modload": case "loadmod":
		try {
			for (args = args.join(" ").split(","); args.length;)
				this.loadModule(args.shift());
		} catch (ex) {
			e.reply(ex.fileName + ":" + ex.lineNumber, ex);
		}
		break;
	case "reload":
		if (!run("aucgbot.js")) {
			e.reply("I can't find myself!");
			e.log("Can't reload!");
		}
		break;
	default:
		if (this.modMethod("remoteControl", arguments))
			break;
		e.notice("Hmm? Didn't quite get that.");
	}
};
/**
 * Check if the specified user is a superuser.
 *
 * @param {string} nick User's nickname.
 * @param {string} ident User's username.
 * @param {string} host User's hostname.
 * @param {string} dest Destination of message, if any.
 * @param {string} relay Relay bot, if any.
 * @return {boolean} Whether the user is a superuser.
 */
aucgbot.isSU = function isSU(e) {
	if (this.prefs.suDests.contains(e.dest))
		return true;
	var suHosts = this.prefs.suHosts, host = e.host;
	if (suHosts instanceof RegExp) {
		if (suHosts.test(host))
			return true;
	}
	if (suHosts instanceof Array) {
		if (suHosts.contains(host))
			return true;
	}
	return false;
};
aucgbot.okToKick = function okToKick(e) {
	var nick = e.nick, host = e.host, dest = e.dest, conn = e.conn;
	if (e.relay || dest === nick || this.isSU(e))
		return false;
	if (conn && nick === conn.nick)
		return false;
	var nokickNicks = this.prefs["nokick.nicks"], nokickHosts = this.prefs["nokick.hosts"];
	if (nokickNicks instanceof RegExp) {
		if (nokickNicks.test(nick))
			return false;
	}
	if (nokickNicks instanceof Array) {
		if (nokickNicks.contains(nick))
			return false;
	}
	if (nokickHosts instanceof RegExp) {
		if (nokickHosts.test(host))
			return false;
	}
	if (nokickHosts instanceof Array) {
		if (nokickHosts.contains(host))
			return false;
	}
	return true;
};
/**
 * Load a module.
 *
 * @param {string} id Module name (filename without .jsm extension).
 * @throws TypeError when the module cannot be loaded.
 * @return {Object} The loaded module.
 */
aucgbot.loadModule = function loadModule(id) {
	try {
		module = {}; // must leak to global scope to reach module itself
		if (run(id + ".jsm") && module.version)
			this.modules[id] = module;
		else
			throw new TypeError(id + " is not a module.");
		writeln("Loaded mod_", id, " v", module.version);
		return module;
	} finally {
		delete module;
	}
};
/**
 * Loop through, find and execute methods in currently loaded modules.
 *
 * @param {string} id Method name.
 * @param {Array} args Arguments to pass to the method.
 * @return {boolean} Whether to stop processing the event.
 */
aucgbot.modMethod = function modMethod(id, args) {
	if (typeof args.length !== "number")
		args = Array.slice(arguments, 1);
	try {
		for (var m in this.modules) {
			if (this.modules.hasOwnProperty(m)) {
				module = this.modules[m];
				if (typeof module === "object" && module && module.hasOwnProperty(id)) {
					method = module[id];
					if (typeof method === "function" && method.apply(module, args))
						return true;
				}
			}
		}
	} finally {
		delete module;
	}
	return false;
};

aucgbot.getHTTP = function getHTTP(uri, modname, modver, headers) {
	headers = headers || {};
	var useragent = this.useragent;
	if (modname) {
		useragent += " mod_" + modname;
		if (modver)
			useragent += "/" + modver;
	}
	headers["User-Agent"] = useragent;
	return this.readURI(uri, headers);
};
aucgbot.readURI = function readURI(uri, headers) {
	var stream = new Stream(uri, null, headers), content;
	sleep(this.prefs.readDelay);  // wait a tick so that the entire file actually comes through
	if (stream.header) {
		var record = new Record(stream.header);
		record.caseSensitive = false;
		var len = record.get("Content-Length") | 0;
		if (len) {
			content = stream.read(len);
		} else {
			content = stream.readFile();
		}
	} else {
		content = stream.readFile();
	}
	stream.close();
	try {
		content = decodeUTF8(content);
	} catch (ex) {}
	if (stream.status && stream.status >= 300) {
		throw new this.HTTPError(stream, content);
	}
	return content;
};
aucgbot.getJSON = function getJSON() {
	return JSON.parse(this.getHTTP.apply(this, arguments));
};
aucgbot.getXML = function getXML() {
	return new XML(this.getHTTP.apply(this, arguments).replace(/^<\?xml\s+[^?]*\?>/, ""));
};

/** @constructor */
aucgbot.HTTPError = function HTTPError(stream, content) {
	this.message = "HTTP {0} {1}".format(stream.status, stream.statusText);
	this.stream = stream;
	this.status = stream.status;
	this.statusText = stream.statusText;
	this.content = content;
	this.stack = new Error().stack;
};
aucgbot.HTTPError.prototype.name = "HTTPError";
aucgbot.HTTPError.prototype.toString = function toString() {
	return this.name + ": " + this.message;
};

/** @constructor */
aucgbot.Message = function Message(conn, msgary) {
	var ln = msgary[0], nick = msgary[1], ident = msgary[2], host = msgary[3], dest = msgary[4], msg = msgary[5];
	this.msg = msg, this.nick = nick, this.ident = ident, this.host = host, this.conn = conn, this.ln = ln, this.sentTo = dest;
	this.dest = dest === conn.nick ? nick : dest;
	return self;
};
aucgbot.Message.prototype = {
	bot: aucgbot,
	send: function send() {
		var args = Array.slice(arguments), conn = this.conn;
		args.unshift(this.dest);
		return conn.msg.apply(conn, args);
	},
	nmsg: function nmsg() {
		var args = Array.slice(arguments), conn = this.conn;
		args.unshift(this.dest);
		return conn.nmsg.apply(conn, args);
	},
	notice: function notice() {
		var args = Array.slice(arguments), conn = this.conn;
		args.unshift(this.nick);
		return conn.notice.apply(conn, args);
	},
	reply: function reply() {
		// don't use Array.concat, it doesn't work with the arguments object
		var args = Array.slice(arguments), conn = this.conn;
		args.unshift(this.nick), args.unshift(this.dest);
		return conn.reply.apply(conn, args);
	},
	nreply: function nreply() {
		var args = Array.slice(arguments), conn = this.conn;
		args.unshift(this.nick), args.unshift(this.dest);
		return conn.nreply.apply(conn, args);
	},
	log: function _log() {
		var args = Array.slice(arguments), bot = this.bot;
		args.unshift(this.conn);
		bot.log.apply(bot, args);
	},
	logError: function logError() {
		var args = Array.slice(arguments), bot = this.bot;
		args.unshift(this.conn);
		bot.logError.apply(bot, args);
	},
	isSU: function isSU() {
		return this.bot.isSU(this);
	},
	okToKick: function okToKick() {
		return this.bot.okToKick(this);
	},
};

/** @constructor */
aucgbot.IRCStream = function IRCStream(host, port) {
	var addr = (host || "127.0.0.1") + ":" + (parseInt(port) || 6667);
	// Let's make them use strings if they want SSL! Yes, that's what I'll do.
	// Note: SSL support has been commented out due to its instability until I decide what to do.
	/*
	if (typeof port === "string" && port[0] === "+") {
		Stream.call(this, "exec://openssl s_client -quiet -connect " + addr);
	} else {
		Stream.call(this, "net://" + addr);
	}
	*/
	Stream.call(this, "net://" + addr);
	this.addr = addr;
};
aucgbot.IRCStream.prototype.__proto__ = Stream.prototype;

/**
 * Send data to an IRC server.
 *
 * @this {IRCStream} IRC server connection
 * @usage conn.send(data...)
 * @link IRCStream.prototype#msg
 * @link IRCStream.prototype#reply
 * @return {number} Number of bytes sent.
 */
IRCStream.prototype.send = function send(/* ...data */) {
	if (!arguments.length)
		throw new TypeError("IRCStream.prototype.send requires at least 1 argument");
	var data = encodeUTF8(Array.join(arguments, " ").trim());
	if (data)
		return this.writeln(data);
};
/**
 * Send a PRIVMSG to a specified destination.
 *
 * @this {IRCStream} IRC server connection
 * @usage conn.msg(dest, msg...)
 * @param {string} dest Channel or nick to send message to.
 * @param {string} msg Message to send.
 * @link IRCStream.prototype#send
 * @link IRCStream.prototype#reply
 * @return {number} Number of bytes sent.
 */
IRCStream.prototype.msg = function msg(dest) {
	if (arguments.length < 2)
		throw new TypeError("IRCStream.prototype.msg requires at least 2 arguments");
	var msg = Array.slice(arguments, 1).join(" ").trim().replace(/\s+/g, " ");
	if (msg)
		return this.writeln("PRIVMSG ", encodeUTF8(dest + " :" + msg));
};
IRCStream.prototype.nmsg = function nmsg(dest) {
	if (arguments.length < 2)
		throw new TypeError("IRCStream.prototype.nmsg requires at least 2 arguments");
	var msg = Array.slice(arguments, 1).join(" ").trim().replace(/\s+/g, " ");
	if (msg)
		return this.writeln(this.chantypes.contains(dest[0]) ? "PRIVMSG " : "NOTICE ", encodeUTF8(dest + " :" + msg));
};
IRCStream.prototype.notice = function notice(dest) {
	if (arguments.length < 2)
		throw new TypeError("IRCStream.prototype.notice requires at least 2 arguments");
	var msg = Array.slice(arguments, 1).join(" ").trim().replace(/\s+/g, " ");
	if (msg)
		return this.writeln("NOTICE ", encodeUTF8(dest + " :" + msg));
}; 
/**
 * Reply to a user request.
 *
 * @this {IRCStream} IRC server connection
 * @usage conn.reply(dest, nick, msg...)
 * @param {string} dest Channel or nick to send message to.
 * @param {string} nick Nick to direct message at.
 * @param {string} msg Message to send to user.
 * @link IRCStream.prototype#send
 * @link IRCStream.prototype#msg
 * @return {number} Number of bytes sent.
 */
IRCStream.prototype.reply = function reply(dest, nick) {
	if (arguments.length < 3)
		throw new TypeError("IRCStream.prototype.reply requires at least 3 arguments");
	var msg = Array.slice(arguments, 2).join(" ").trim().replace(/\s+/g, " ");
	if (dest !== nick)
		msg = nick + ": " + msg;
	if (msg)
		return this.writeln("PRIVMSG ", encodeUTF8(dest + " :" + msg));
};
IRCStream.prototype.nreply = function nreply(dest, nick) {
	if (arguments.length < 3)
		throw new TypeError("IRCStream.prototype.nreply requires at least 3 arguments");
	var msg = Array.slice(arguments, 2).join(" ").trim().replace(/\s+/g, " ");
	if (dest !== nick)
		msg = nick + ": " + msg;
	if (msg)
		return this.writeln(this.chantypes.contains(dest[0]) ? "PRIVMSG " : "NOTICE ", encodeUTF8(dest + " :" + msg));
};
IRCStream.prototype.chantypes = "#&+!";
/**
 * Write text to the log file.
 *
 * @usage aucgbot.log(conn, data...)
 * @param {IRCStream} conn Server connection.
 */
aucgbot.log = function _log(conn) {
	if (!this.prefs.log)
		return;
	if (arguments.length < 2)
		throw new TypeError("aucgbot.log requires at least 2 arguments");
	var file = new Stream("aucgbot.log", "a");
	file.writeln(conn.addr, ": ", Date.now(), ": ", encodeUTF8(Array.slice(arguments, 1).join(": ").trim()));
	file.close();
};
aucgbot.logError = function logError(conn, errorType, ex) {
	if (ex == null)
		throw new TypeError("aucgbot.logError requires at least 3 arguments");
	var a = [conn, "ERROR", errorType], b = Array.slice(arguments, 2);
	if (ex.fileName && ex.lineNumber != null) {
		a.push(ex.fileName + ":" + ex.lineNumber);
	}
	writeln("[ERROR] ", ex);
	this.log.apply(this, a.concat(b));
};

if (typeof randint !== "function")
/**
 * Generate a psuedo-random integer. Similar to Python's random.randint method.
 *
 * @param {number} [min] Minimum number (default: 1).
 * @param {number} [max] Maximum number (default: 10).
 * @return {number} Random integer.
 */
randint = function randint(min, max) {
	min = min != null ? +min : 1;
	max = max != null ? max : 10;
	if (min >= max)
		return NaN;
	return Math.floor(Math.random() * (max - min + 1)) + min;
};

if (typeof Array.random !== "function")
Array.random = function random(a) {
	return a[Math.floor(Math.random() * a.length)];
};
if (typeof Array.prototype.random !== "function")
/**
 * Get a random element of an array. http://svendtofte.com/code/usefull_prototypes
 *
 * @this {Array}
 * @return {*} Random element from array.
 */
Array.prototype.random = function random() {
	return this[Math.floor(Math.random() * this.length)];
};

if (typeof Array.contains !== "function")
Array.contains = function contains(a, e) {
	return Array.indexOf(a, e) !== -1;
};
if (typeof Array.prototype.contains !== "function")
/**
 * ES6 shim: Check if an array contains an element.
 *
 * @this {Array} The array to check the contents of.
 * @param {*} e An element to check.
 * @return {Boolean} Whether the string contains the substring.
 */
Array.prototype.contains = function contains(e) {
	return this.indexOf(e) !== -1;
};

if (typeof String.contains !== "function")
String.contains = function contains(t, s) {
	return String.indexOf(t, s) !== -1;
};
if (typeof String.prototype.contains !== "function")
/**
 * ES6 shim: Check if a string contains a substring.
 *
 * @this {String} The string to check the contents of.
 * @param {String} s The substring to check.
 * @return {Boolean} Whether the string contains the substring.
 */
String.prototype.contains = function contains(s) {
	return this.indexOf(s) !== -1;
};

if (typeof Object.keys !== "function")
Object.keys = function keys(o) {
	var a = [];
	for (var i in o) {
		if (Object.hasOwnProperty(o, i))
			a.push(i);
	}
	return a;
};

if (typeof Object.is !== "function")
Object.is = function is(x, y) {
	return x === y ? x !== 0 || 1 / x == 1 / y : x !== x && y !== y;
};

writeln("aucgbot ", aucgbot.version, " loaded.");
