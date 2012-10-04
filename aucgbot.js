// -*- Mode: JavaScript; tab-width: 4 -*- vim:tabstop=4:
/**
 * @license This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * @fileoverview Designed to be run by <a href="http://jsdb.org">JSDB</a>.
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

if (!aucgbot)
var aucgbot = {
	prefs: {
		flood: {
			lines: 6,
			secs: 3,
			check: true,
			log: true,
			kick: true, // not if message was relayed
			ban: false, // during flood
			warn: false // warn user sending message in PM when flood starts
		},
		log: true, // toggle all logging
		prefix: "\\\\", // command prefix
		zncBufferHacks: false, // use ZNC buffer timestamps hack
		autoAcceptInvite: true, // automatically join on invite
		"relay.check": true, // toggle relay bot checking
		"relay.bots": /^(?:iRelayer|janus|Mingbeast|irfail|rbot)$/, // regex tested against nicks to check for relay bots
		"keyboard.sendInput": false,
		"keyboard.dieOnInput": false, // keyboard.sendInput must be false
		"kick.rejoin": false,
		"kick.log": true, // on bot kicked
		// RegExps to not ban/kick nicks/hosts
		"nokick.nicks": /Tanner|Mardeg|aj00200|ChrisMorgan|JohnTHaller|Bensawsome|juju|Shadow|TMZ|aus?c(ompgeek|g|ow)|Jan|Peng|TFEF|Nightmare/,
		"nokick.hosts": /bot|spam|staff|dev|math|js|[Jj]ava[Ss]cript/,
		// regex for allowed hosts to use rc command
		suHosts: /trek|aucg|^(?:freenode\/)?(?:staff|dev)|oper|netadmin|geek|gry|bot(?:ter)?s|spam|^(?:127\.\d+\.\d+\.\d+|localhost(?:\.localdomain)?)$/
	},
	//cmodes: {}, // XXX Parse MODE lines.
	modules: {},
	conns: [],
	global: this
};
aucgbot.version = "4.0.1 (4 Oct 2012)";

/**
 * Start the bot. Each argument is to be passed as arguments to {@link aucgbot#connect}.
 *
 * @usage aucgbot.start([hostname, port, nick, ident, pass, channels]...);
 */
aucgbot.start =
function startBot() {
	for (let args = Array.prototype.slice.call(arguments); args.length; )
		this.connect.apply(this, args.shift());
	this.started = Date.now();
	this.startLoop();
};
/**
 * Connect the bot. All arguments are optional.
 *
 * @param {string} [host] The hostname to connect to (default: 127.0.0.1)
 * @param {number} [port] The port to connect to (default: 6667)
 * @param {string} [nick] Nick to use (default: aucgbot)
 * @param {string} [ident] Ident to use (default: aucgbot)
 * @param {string} [pass] The server password to use, if any
 * @param {(string|Array.<string>)} [chans] Channels to join on connect (default: #bots)
 * @see aucgbot#start
 */
aucgbot.connect =
function connectBot(host, port, nick, ident, pass, chans) {
	var channels = ["#bots"], addr = (host || "127.0.0.1") + ":" + (parseInt(port) || 6667),
	    conn = new Stream("net://" + addr, "rwt"), ln;
	if (pass) {
		conn.send("PASS", pass);
		pass = null;
	}
	conn.nick = nick || "aucgbot"; conn.flood_lines = 0;
	conn.send("NICK", conn.nick);
	conn.send("USER " + (ident || "aucgbot") + " 8 * :\x033\17auscompgeek's JS bot");
	if (chans) {
		if (chans instanceof Array)
			channels = chans, chans = null;
		else if (typeof chans == "string")
			channels = chans.split(","), chans = null;
		else
			writeln("[WARNING] Can't join channels specified! Joining ", channels);
	} else
		writeln("[WARNING] No channels specified! Joining ", channels);
	for (let i = channels.length, chan; chan = channels[i]; i++)
		channels[i] = /^[#&+!]/.test(chan) ? chan : "#" + chan;
	while ((ln = conn.readln())) {
		writeln(conn.hostName, ": ", ln);
		if (/^PING (.+)/.test(ln))
			conn.send("PONG", RegExp.$1);
		else if (/^:\S+ 433 ./.test(ln))
			conn.send("NICK", conn.nick += "_");
		else if (/^:\S+ 003 ./.test(ln)) {
			if (channels) {
				conn.send("JOIN", channels.join(","));
				channels = null;
			}
			break;
		}
	}
	this.conns.push(conn); system.gc();
};
/**
 * Start the server read line loop.
 *
 * @see aucgbot#start
 */
aucgbot.startLoop =
function startLoop() {
	while (this.conns.length) {
		system.wait(this.conns, 60000);
		for (let i = this.conns.length - 1, conn; conn = this.conns[i]; i--) {
			if (conn.canRead) {
				this.parseln(conn.readln(), conn);
				if (system.kbhit()) {
					if (this.prefs["keyboard.sendInput"])
						conn.send(readln());
					else if (this.prefs["keyboard.dieOnInput"]) {
						conn.send("QUIT :Keyboard input.");
						sleep(500); // Give the server time to receive the QUIT message.
						this.cleanConn(i); continue;
					}
				}
			}
			if (conn.eof) this.cleanConn(i);
		}
	}
};
aucgbot.cleanConn =
function cleanConn(i) {
	this.conns[i].close();
	if (i == this.conns.length - 1)
		this.conns.length--
	else
		delete this.conns[i]; // XXX must be more robust
	system.gc();
}

/**
 * Parse a raw IRC line.
 *
 * @param {string} ln Raw IRC line
 * @param {Stream} conn Server connection
 */
aucgbot.parseln =
function parseIRCln(ln, conn) {
	if (!ln) return; // for weird servers
	try { ln = decodeUTF8(ln); } catch (ex) {}
	writeln(conn.hostName, ": ", ln);
	for each (let module in this.modules) {
		if (typeof module.parseln == "function" && module.parseln(ln, conn))
			return;
	}
	if (/^:(\S+)!\S+@(\S+) ./.test(ln) && RegExp.$1 == conn.nick) this.host = RegExp.$2;
	if ((lnary = /^:(\S+)!(\S+)@(\S+) PRIVMSG (\S+) :(.*)/.exec(ln))) {
		lnary.shift();
		var dest = lnary[0];
		if (/^[#&+!]/.test(lnary[3])) dest = lnary[3];
		this.onMsg(dest, lnary[4], lnary[0], lnary[1], lnary[2], conn);
	} else if (/^PING (.+)/.test(ln)) {
		conn.send("PONG", RegExp.$1);
	} else if (/^:(\S+)!(\S+)@(\S+) INVITE (\S+) :(\S+)/.test(ln)) {
		this.prefs.autoAcceptInvite && conn.send("JOIN", RegExp.$5);
	} else if (/^:(\S+)!(\S+)@(\S+) NICK :(\S+)/.test(ln)) {
		if (RegExp.$1 == conn.nick) conn.nick = RegExp.$4;
	} else if (/^:(\S+)(?:!(\S+)@(\S+))? MODE (\S+)(?: (.+))?/.test(ln)) {
		// XXX Parse!
	} else if (/^:(\S+!\S+@\S+) KICK (\S+) (\S+) :(.*)/.test(ln) && RegExp.$3 == conn.nick) {
		this.prefs["kick.rejoin"] && conn.send("JOIN", RegExp.$2);
		this.prefs["kick.log"] && this.log(conn, "KICK", RegExp.$1, RegExp.$2, RegExp.$4);
	}
}

/**
 * Parse a PRIVMSG.
 *
 * @param {string} dest Channel or nick to send messages back
 * @param {string} msg The message
 * @param {string} nick Nick that sent the PRIVMSG
 * @param {string} ident User's ident
 * @param {string} host Hostname that sent the PRIVMSG
 * @param {Stream} conn Server connection
 */
aucgbot.onMsg =
function onMsg(dest, msg, nick, ident, host, conn) {
	var meping = RegExp("^@?" + conn.nick.replace(/\W/g, "\\$&") + "([:,!.] ?| |$)", "i"), relay = "";

	// fix for buffer playback on ZNC
	if (this.prefs.zncBufferHacks) {
		if (nick == "***") {
			if (msg == "Buffer playback...")
				conn.zncBuffer = true;
			else if (msg == "Playback complete")
				conn.zncBuffer = false;
			return;
		} else if (conn.zncBuffer) msg = msg.replace(/^\[[0-2]?\d:[0-5]\d(?::[0-5]\d)?\] /, "");
	}

	// fix for message relay bots
	if (this.prefs["relay.check"] && nick.match(this.prefs["relay.bots"]) && /^<.+> /.test(msg))
		msg = msg.replace(/^<(.+?)> /, ""), relay = nick, nick = RegExp.$1.replace(/^\[\w+\] ?|\/.+/g, "");

	// don't listen to bots
	if ((/bot[\d_|]*$|Serv|^bot|Op$/i.test(nick) && !(nick == conn.nick)) ||
	   (host.indexOf("/bot/") != -1 && !(nick == conn.nick || relay)))
		return;

	// flood protection
	if (this.prefs.flood.check && this.checkFlood(dest, msg, nick, host, conn, relay)) return;

	msg = msg.replace(/\s+/g, " ");

	for each (let module in this.modules)
		if (typeof module.onMsg == "function" && module.onMsg(dest, msg, nick, ident, host, conn, relay))
			return;

	if (msg[0] == "\1") { // Possible CTCP.
		if (/^\x01([^\1 ]+)(?: ([^\1]*))?/.test(msg))
			this.onCTCP(RegExp.$1.toUpperCase(), RegExp.$2, nick, dest, conn);
	} else if (this.prefs.prefix && msg.slice(0, this.prefs.prefix.length) == this.prefs.prefix) {
		msg = msg.slice(this.prefs.prefix.length).replace(/^(\S+) ?/, "");
		this.parseCmd(dest, RegExp.$1.toLowerCase(), msg, nick, ident, host, conn, relay);
	} else if (meping.test(msg) || dest == nick) {
		msg = msg.replace(meping, "").replace(/^(\S+) ?/, "");
		this.parseCmd(dest, RegExp.$1.toLowerCase(), msg, nick, ident, host, conn, relay);
	}
};
/**
 * Ensure that a message isn't part of a flood.
 *
 * @param {string} dest Channel or nick to send messages back
 * @param {string} msg The message
 * @param {string} nick Nick that sent the PRIVMSG
 * @param {string} host Hostname that sent the PRIVMSG
 * @param {Stream} conn Server connection
 * @param {string} relay Relay bot nick or ""
 * @return {boolean} True if message is part of a flood
 */
aucgbot.checkFlood =
function checkFlood(dest, msg, nick, host, conn, relay) {
	/* XXX Implement this fully. *
	 * Don't try to kick/ban if:
	 *	a) we're not in a channel,
	 *	b) the message was from us
	 *	c) the user matches one of the nokick/superuser prefs
	 -	d) the user in question has any cmodes set
	 -	e) we don't have any cmodes set on us or
	 *	f) the message was sent by a relay bot.
	 */
	var now = Date.now();
	if (conn.zncBuffer) return false;
	if (now - conn.flood_lastTime > this.prefs.flood.secs * 1000) conn.flood_lines = 0;
	if (conn.flood_lines >= this.prefs.flood.lines && now - conn.flood_lastTime <= this.prefs.flood.secs * 1000) {
		let kb = !(relay || dest == nick || nick == conn.nick || host == this.host || nick.match(this.prefs["nokick.nicks"]) || host.match(this.prefs["nokick.hosts"]) || host.match(this.prefs.suHosts) /*|| conn.cmodes[dest][nick]*/) /*&& conn.cmodes[dest][conn.nick]*/;
		conn.flood_lastTime = now;
		if (conn.flood_in) {
			if (kb) {
				this.prefs.flood.kick && conn.send("KICK", dest, nick, ":No flooding!");
				this.prefs.flood.ban && conn.send("MODE", dest, "+b *!*@" + host);
			}
		} else {
			conn.flood_in = true;
			writeln("[WARNING] Flood detected!");
			kb && this.prefs.flood.kick ? conn.send("KICK", dest, nick, ":No flooding!") :
			this.prefs.flood.warn && !relay && conn.send("NOTICE", nick, ":Please don't flood.");
		}
		this.prefs.flood.log && this.log(conn, "Flood", nick + (dest == nick ? "" : " in " + dest), msg);
		return true;
	}
	conn.flood_in = false;
	conn.flood_lastTime = now;
	conn.flood_lines++;
	return false;
};
/**
 * Parse a command filtered by onMsg().
 *
 * @param {string} dest Channel or nick to send messages back
 * @param {string} cmd Command name
 * @param {string} args Any arguments
 * @param {string} nick Nick that sent the PRIVMSG
 * @param {string} ident User's ident
 * @param {string} host Hostname that sent the PRIVMSG
 * @param {Stream} conn Server connection
 * @param {string} relay Relay bot nick or ""
 */
aucgbot.parseCmd =
function parseCmd(dest, cmd, args, nick, ident, host, conn, relay) {
	switch (cmd) {
	case "ping":
		conn.reply(dest, nick, "pong", args);
		break;
	case "version":
		conn.reply(dest, nick, "aucgbot", this.version);
		break;
	case "rc":
		args = args.split(" ");
		host.match(this.prefs.suHosts) && this.remoteControl(args[0], args.slice(1), dest, nick, conn);
		break;
	case "status": case "uptime":
		conn.reply(dest, nick, "I've been up", this.up() + ".");
		break;
	case "listmods": case "modlist":
		let mods = [];
		for (let i in this.modules) mods.push(i + " " + this.modules[i].version);
		mods.length && conn.send("NOTICE", nick, ":Modules:", mods.join(", "));
		break;
	case "listcmds": case "cmdlist":
		let cmds = [];
		for each (let m in this.modules) {
			for (let i in m) {
				if (i.slice(0, 4) == "cmd_")
					cmds.push(i.slice(4));
			}
		}
		cmds.length && conn.send("NOTICE", nick, ":" + cmds.join(" "));
		break;
	default:
		for each (let module in this.modules) {
			if ((typeof module.parseCmd == "function" && module.parseCmd.apply(module, arguments)) ||
			   (typeof module["cmd_" + cmd] == "function" && module["cmd_" + cmd](dest, args, nick, ident, host, conn, relay)))
				break;
		}
	}
};
/**
 * Get the uptime of the bot.
 *
 * @author Ogmios
 * @return {string} Uptime in human readable format
 */
aucgbot.up =
function uptime() {
	var diff = Math.round((Date.now() - this.started) / 1000),
		s = diff % 60, m = (diff % 3600 - s) / 60,
		h = Math.floor(diff / 3600) % 24, d = Math.floor(diff / 86400);
	return (d ? d + "d " : "") + (h ? h + "h " : "") + (m ? m + "m " : "") + (s ? s + "s" : "");
};
/**
 * Parse a CTCP request.
 *
 * @param {string} type CTCP request type
 * @param {string} msg Any arguments
 * @param {string} nick Nick of the requestee
 * @param {string} dest Channel to which the request was sent (`nick` if sent in PM)
 * @param {Stream} conn Server connection
 */
aucgbot.onCTCP =
function onCTCP(type, msg, nick, dest, conn) {
	for each (let module in this.modules)
		if (typeof module.onCTCP == "function" && module.onCTCP.apply(module, arguments))
			return;
	switch (type) {
	case "ACTION":
		break;
	case "VERSION":
		nctcp(nick, type, "aucg's JS IRC bot v" + this.version +
				" (JSDB " + system.release + ", JS " + (system.version / 100) + ")");
		break;
	case "TIME":
		nctcp(nick, type, Date());
		break;
	case "SOURCE": case "URL":
		nctcp(nick, type, "https://github.com/auscompgeek/aucgbot on http://jsdb.org");
		break;
	case "PING":
		nctcp(nick, type, msg);
		break;
	case "UPTIME": case "AGE":
		nctcp(nick, type, this.up());
		break;
	case "GENDER": case "SEX":
		nctcp(nick, type, "bot");
		break;
	case "LOCATION":
		nctcp(nick, type, "behind you");
		break;
	case "A/S/L": case "ASL":
		nctcp(nick, type, "2/bot/behind you");
		break;
	case "AVATAR": case "ICON": case "FACE":
		break;
	case "LANGUAGES": case "LANGUAGE":
		nctcp(nick, type, "JS,en");
		break;
	default:
		writeln("[ERROR] Unknown CTCP! ^^^^^");
		this.log(conn, "CTCP", nick + (nick == dest ? "" : " in " + dest), type, msg);
	}
	function nctcp(nick, type, msg) conn.send("NOTICE", nick, ":\1" + type, msg + "\1");
};
/**
 * Parses a control signal from a user with remote control privileges.
 *
 * @param {string} cmd Command
 * @param {string} args Any arguments
 * @param {string} dest Channel or nick to send messages back
 * @param {string} nick Nick that sent the signal
 * @param {Stream} conn Server connection
 */
aucgbot.remoteControl =
function rcBot(cmd, args, dest, nick, conn) {
	cmd != "log" && this.log(conn, "RC", nick + (dest == nick ? "" : " in " + dest), cmd, args.join(" "));
	switch (cmd) {
	case "self-destruct": // Hehe, I had to put this in :D
	case "explode":
		conn.send("QUIT :" + nick + ":", "10... 9... 8... 7... 6... 5... 4... 3... 2... 1... 0... *boom*", args.join(" "));
		sleep(500);
		conn.close();
		break;
	case "die":
		conn.send("QUIT :" + nick + ":", args.join(" "));
		sleep(500);
		conn.close();
		break;
	case "connect":
		args = /^(?:irc:\/\/)?(\w[\w.-]+\w)(?::([1-5]\d{0,4}|[6-9]\d{0,3}|6[0-4]\d{3}|65[0-4]\d\d|655[0-2]\d))?(?:\/([^?]*))?(?:\?pass=(.+))?$/.exec(args);
		if (!args) { // Invalid URL?!?!?
			writeln("[ERROR] Invalid URL! ^^^^^");
			break;
		}
		args.shift();
		try {
			this.connect(args[0], args[1], conn.nick, "", args[3], args[2]);
		} catch (ex) {
			writeln("[ERROR] ", ex);
			conn.reply(dest, nick, "Error while connecting:", ex);
			this.log(conn, "CONNECT FAIL", args[0], ex);
		}
		break;
	case "join":
		args = args.join(" ").split(",");
		for (let i in args) if (!/^[#&+!]/.test(args[i])) args[i] = "#" + args[i];
		conn.send("JOIN", args.join(","));
		break;
	case "leave":
		var chans = args.shift().split(",");
		for (let i in chans) if (!/^[#&+!]/.test(chans[i])) chans[i] = "#" + chans[i];
		conn.send("PART", chans.join(","), ":" + nick + ":", args.join(" "));
		break;
	case "kick":
		var chan = args.shift();
		if (args[0] == conn.nick) {
			conn.reply(dest, nick, "Get me to kick myself, yeah, great idea...");
			break;
		}
		if (/^[^#&+!]/.test(chan)) chan = "#" + chan;
		conn.send("KICK", chan, args.shift(), ":" + nick + ":", args.join(" "));
		break;
	case "msg": case "privmsg": case "message":
		if (args[0] == conn.nick) {
			conn.reply(dest, nick, "Get me to talk to myself, yeah, great idea...");
			break;
		}
		args.unshift(conn);
		this.msg.apply(this, args);
		break;
	case "echo": case "say":
		conn.msg(dest, args.join(" "));
		break;
	case "quote": case "raw":
		conn.send(args.join(" "));
		break;
	case "eval": case "js": // Dangerous!
		args = args.join(" ");
		// could cause a crash if unhandled
		if (/(stringify|uneval).*(aucgbot|this|global)/i.test(args)) {
			writeln("[WARNING] Possible abuse! ^^^^^");
			conn.send("NOTICE", nick, ":Please don't try to abuse my remote control.");
			break;
		}
		try { var res = eval(args); } catch (ex) { res = "exception: " + ex; }
		if (typeof res == "function") res = "function";
		res && conn.reply(dest, nick, res);
		break;
	/*case "pref":
		if (this.prefs[args[0]] == undefined)
		{	this.send("NOTICE", nick)
		}*/
	case "log":
		this.log(conn, "LOG", nick + (dest == nick ? "" : " in " + dest), args.join(" "));
		break;
	case "modload": case "loadmod":
		try {
			for (args = args.join(" ").split(","); args.length; )
				this.loadModule(args.shift());
		} catch (ex) { conn.reply(dest, nick, ex); }
		break;
	case "reload":
		if (!run("aucgbot.js")) {
			conn.reply(dest, nick, "I can't find myself!");
			this.log(conn, "Can't reload!");
		}
		break;
	default:
		writeln("[ERROR] Possible abuse attempt! ^^^^^");
		conn.send("NOTICE", nick, ":Hmm? Didn't quite get that.");
	}
};
/**
 * Load a module.
 *
 * @param {string} m Module name (filename without .jsm extension)
 * @throws TypeError when the module cannot be loaded.
 */
aucgbot.loadModule =
function loadModule(m) {
	module = {}; // must leak to global scope to reach module itself
	if (run(m + ".jsm") && module.version)
		this.modules[m] = module;
	else
		throw new TypeError(m + " is not a module.");
	println("Loaded module ", m, " version ", module.version);
	delete this.global.module;
};

/**
 * Send data to an IRC server.
 *
 * @this {Stream} IRC server connection
 * @usage conn.send(data...)
 * @return {number} Number of bytes sent
 */
Stream.prototype.send =
function send() {
	var s = Array.prototype.slice.call(arguments);
	if (s.length < 1) throw new TypeError("Stream.prototype.send requires at least 2 arguments");
	return this.writeln(s.join(" ").trim().replace(/\s+/, " "));
};
/**
 * Send a PRIVMSG to a specified destination.
 *
 * @this {Stream} IRC server connection
 * @usage conn.msg(dest, msg...)
 * @link Stream.prototype#send
 * @return {number} Number of bytes sent
 */
Stream.prototype.msg =
function msg() {
	var s = Array.prototype.slice.call(arguments, 1);
	s[1] = ":" + s[1]; s.unshift("PRIVMSG");
	return this.send.apply(this, s);
};
/**
 * Reply to a user request.
 *
 * @this {Stream} IRC server connection
 * @usage conn.reply(dest, nick, msg...)
 * @param {Stream} conn Server connection
 * @link Stream.prototype#send
 * @link Stream.prototype#msg
 * @return {number} Number of bytes sent
 */
Stream.prototype.reply =
function reply(dest, nick) {
	var msg = Array.prototype.slice.call(arguments, 2).join(" ").trim().replace(/\s+/g, " ");
	if (!msg) throw new TypeError("Stream.prototype.reply requires at least 3 arguments");
	if (dest != nick) msg = nick + ": " + msg;
	return this.writeln("PRIVMSG " + dest + " :" + msg);
};
/**
 * Write text to the log file.
 *
 * @usage aucgbot.log(conn, data...)
 * @param {Stream} conn Server connection
 */
aucgbot.log =
function log(conn) {
	if (!this.prefs.log) return;
	if (arguments.length < 2) throw new TypeError("aucgbot.log requires at least 2 arguments");
	var s = [conn.hostName, Date.now()], log;
	for (let i = 1; i < arguments.length; i++)
		s[i+1] = arguments[i];
	log = new Stream("aucgbot.log", "a");
	log.writeln(s.join(": ").trim().replace(/\s+/, " "));
	log.close();
};

/**
 * Generate a (psuedo-)random integer.
 *
 * @param {number} [min] Minimum number (default: 1)
 * @param {number} [max] Maximum number (default: 10)
 */
if (typeof ranint != "function")
function ranint(min, max) {
	min = min != null ? min : 1;
	max = max != null ? max : 10;
	if (min >= max) return NaN;
	return Math.floor(Math.random() * (max - min + 1)) + min;
}
/**
 * Get a random element of an array. http://svendtofte.com/code/usefull_prototypes
 *
 * @this {Array}
 * @return {?} Random element of array.
 */
if (typeof Array.prototype.random != "function")
Array.prototype.random =
function random() this[Math.floor((Math.random()*this.length))];

writeln("aucgbot loaded.");