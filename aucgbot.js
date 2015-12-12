// vim:ts=4 ft=javascript noexpandtab
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
/* jshint expr: true */
/* globals encodeB64 */

"use strict";

var net = require("net"),
	url = require("url"),
	util = require("util"),
	fs = require("fs"),
	request = require("urllib-sync").request,
	Entities = require("html-entities").AllHtmlEntities;
require("string-format").extend(String.prototype);
var entities = new Entities();

global.aucgbot = global.aucgbot || {
	ERR_MSG_SELF: "Get me to talk to myself, yeah, great idea...",
	prefs: {
		flood: {
			differentiate: true, // treat all users as the same or not? (false may result in kicking of innocents)
			lines: 8,
			secs: 2,
			check: true,
			log: true,
			kick: true, // not if message was relayed
			ban: false, // during flood
			warn: false // warn user sending message in PM when flood starts
		},
		readDelay: 150, // delay on readURI()
		log: false, // toggle all logging
		prefix: "+", // command prefix
		zncBufferHacks: false, // use ZNC buffer hacks
		zncBufferTSHack: false, // use ZNC buffer timestamps hack
		autoAcceptInvite: false, // automatically join on invite
		"relay.check": true, // toggle relay bot checking
		"relay.bots": ["iRelayer", "janus", "Mingbeast", "irfail", "rbot"],
		printMessages: true,
		"kick.rejoin": false,
		"kick.log": true, // on bot kicked
		// RegExps to not ban/kick nicks/hosts
		"nokick.nicks": /Tanner|Mardeg|aj00200|ChrisMorgan|JohnTHaller|Bensawsome|juju|Shadow|TMZ|aus?c(ompgeek|g|ow)|janb|Peng|TFEF|Nightmare/,
		"nokick.hosts": /botters|staff|dev|math|javascript/,
		bots: ["PaperBag", "root"], // bot nicks that don't match the bot regex
		suDests: [],
		// regex for allowed hosts to use rc command
		suHosts: /\/(?:auscompgeek|forkbomb|gnustomp)$/
	},
	//cmodes: {}, // TODO Parse MODE lines.
	modules: {},
	conns: {}
};

aucgbot.version = "6.0.3 (2015-12)";
aucgbot.source = "https://github.com/auscompgeek/aucgbot/tree/forkbomb-nodejs";
aucgbot.useragent = "aucgbot/{0} (+{1}; {2}; Node.js {3})".format(aucgbot.version, aucgbot.source, process.platform, process.version);
// JSDB shims
global.decodeHTML = entities.decode;

/**
 * Start the bot. Each argument is to be passed as arguments to {@link aucgbot#connect}.
 *
 * @usage aucgbot.start([hostname, port, nick, ident, pass, channels]...);
 */
aucgbot.start = function startBot() {
	var args = Array.from(arguments);
	while (args.length)
		this.connect.apply(this, args.shift());
	args = null;
	this.started = Date.now();
};

aucgbot.connect = function connectBot(host, port, nick, ident, pass, chans, sasluser, saslpass) {
	host = host || "127.0.0.1";
	port = parseInt(port) || 6667;
	var channels = ["#bots"], addr = host + ":" + port, conn, ln;

	if (this.conns.hasOwnProperty(addr)) {
		console.log("Stubbornly refusing to connect again to", addr);
		return;
	}

	conn = net.connect(port, host, function() {
		console.log("Connected to " + addr);
	});
	conn.nick = nick;

	// We don't feel like sticking these on net.Socket.prototype.
	conn.msg = function msg(dest, ...m) {
		if (!m.length)
			throw new TypeError("conn.msg requires a message to send");
		m = m.join(" ").trim().replace(/\s+/g, " ");
		if (m)
			return this.writeln("PRIVMSG ", dest, " :", m);
	};
	conn.nmsg = function nmsg(dest, ...msg) {
		if (!msg.length)
			throw new TypeError("conn.nmsg requires at least 2 arguments");
		msg = msg.join(" ").trim().replace(/\s+/g, " ");
		if (msg)
			return this.writeln(this.chantypes.includes(dest[0]) ? "PRIVMSG " : "NOTICE ", dest, " :", msg);
	};
	conn.notice = function notice(dest, ...msg) {
		if (!msg.length)
			throw new TypeError("conn.notice requires at least 2 arguments");
		msg = msg.join(" ").trim().replace(/\s+/g, " ");
		if (msg)
			return this.writeln("NOTICE ", dest, " :", msg);
	};
	conn.reply = function reply(dest, nick, ...msg) {
		if (!msg.length)
			throw new TypeError("conn.reply requires at least 3 arguments");
		msg = msg.join(" ").trim().replace(/\s+/g, " ");
		if (dest !== nick)
			msg = nick + ": " + msg;
		if (msg)
			return this.writeln("PRIVMSG ", dest, " :", msg);
	};
	conn.nreply = function nreply(dest, nick, ...msg) {
		if (!msg.length)
			throw new TypeError("conn.nreply requires at least 3 arguments");
		msg = msg.join(" ").trim().replace(/\s+/g, " ");
		if (dest !== nick)
			msg = nick + ": " + msg;
		if (msg)
			return this.writeln(this.chantypes.includes(dest[0]) ? "PRIVMSG " : "NOTICE ", dest, " :", msg);
	};

	conn.chantypes = "#&+!";
	conn.addr = addr;
	conn.setEncoding('utf8');
	if (pass) {
		conn.send("PASS", pass);
		pass = null;
	}

	if (sasluser && saslpass) {
		conn.send("CAP REQ sasl");
	}

	conn.send("NICK", nick || "aucgbot");
	conn.send("USER", ident || "aucgbot", "8 * :\x033\x0fauscompgeek's JS bot - Node.js version");
	if (chans) {
		if (chans instanceof Array) {
			channels = chans;
		} else if (typeof chans === "string") {
			channels = chans.split(",");
		} else {
			console.warn("[WARNING] Can't join channels specified! Joining", channels);
		}
	} else {
		console.warn("[WARNING] No channels specified! Joining", channels);
	}
	chans = null;
	if (aucgbot.prefs.flood.differentiate) {
		conn.flood_lines = {};
		conn.flood_lastTime = {};
		conn.flood_in = {};
	}
	else {
		conn.flood_lines = 0;
		conn.flood_lastTime = 0;
		conn.flood_in = false;
	}

	var buffer = "";
	conn.on("data", function(data) {
		var lines = (buffer + data).split("\n");
		buffer = lines.pop();
		lines.forEach(this.onLine, this);
	});

	conn.registered = false;
	conn.onLine = function(ln) {
		ln = ln.trim();
		if (!ln) return;
		if (aucgbot.prefs.printMessages)
			console.log(ln);

		if (!conn.registered) {
			if (ln.startsWith("PING ")) {
				conn.send("PONG", ln.slice(5));
			} else if (ln === "AUTHENTICATE +") {
				conn.send("AUTHENTICATE", encodeB64(sasluser + "\0" + sasluser + "\0" + saslpass));
				sasluser = saslpass = null;
			} else if (/^:\S+ CAP \S+ ACK :sasl/.test(ln)) {
				conn.send("AUTHENTICATE PLAIN");
			} else if (/^:\S+ 90([345]) ./.test(ln)) {
				conn.send("CAP END");
				let obj = /^:\S+ 90([345]) ./.exec(ln)[1];
				if (obj !== "3") {
					conn.send("QUIT");
					conn.end(null, function() {
						console.log("Disconnected from", conn.addr);
					});
					return;
				}
			} else if (/^:\S+ 433 ./.test(ln)) {
				conn.send("NICK", conn.nick += "_");
			} else if (/^:\S+ 001 /.test(ln)) {
				if (channels) {
					conn.send("JOIN", ":" + channels/*.map(function (chan) { return conn.chantypes.includes(chan[0]) ? chan : "#" + chan; })*/.join(","));
					channels = null;
					conn.registered = true;
				}
			}

		} else {
			try {
				if (aucgbot.modMethod("parseln", [ln, conn]))
					return;
			} catch (ex) {
				console.error("error in parseln:", ex);
			}

			var msgary = /^:([^\s!@]+)!([^\s!@]+)@([^\s!@]+) PRIVMSG (\S+) :(.*)/.exec(ln);
			if (msgary) {
				let e = new aucgbot.Message(this, msgary);
				msgary = null;
				aucgbot.onMsg(e);
				e = null;
			} else if (ln.startsWith("PING ")) {
				conn.send("PONG", ln.slice(5));
			} else if (/^:([^\s!@]+![^\s!@]+@[^\s!@]+) INVITE \S+ :(\S+)/.test(ln)) {
				aucgbot.log(conn, "INVITE", RegExp.$1, RegExp.$2);
				if (aucgbot.prefs.autoAcceptInvite)
					conn.send("JOIN", RegExp.$2);
			} else if (/^:([^\s!@]+)!([^\s!@]+)@([^\s!@]+) NICK :(\S+)/.test(ln)) {
				if (RegExp.$1 === conn.nick)
					conn.nick = RegExp.$4;
				else {
					try {
						aucgbot.modMethod("onNick", [{conn: conn, oldNick: RegExp.$1, newNick: RegExp.$4, ident: RegExp.$2, host: RegExp.$3, ln: ln}]);
					} catch (ex) {
						console.error("error in onNick:", ex);
					}
				}
			//} else if (/^:([^\s!@]+)(?:!([^\s!@]+)@([^\s!@]+)|) MODE (\S+) ((?:[+\-][A-Za-z]+)+)/.test(ln)) {
				// TODO parse MODE lines
			} else if (/^:([^\s!@]+![^\s!@]+@[^\s!@]+) KICK (\S+) (\S+) :(.*)/.test(ln)) {
				if (RegExp.$3 === conn.nick) {
					if (aucgbot.prefs["kick.rejoin"])
						conn.send("JOIN", RegExp.$2);
					if (aucgbot.prefs["kick.log"])
						aucgbot.log(conn.addr, "KICK", RegExp.$1, RegExp.$2, RegExp.$4);
				}
			}
		}
	};

	conn.setTimeout(600000, function () {
		console.warn("Timeout triggered on", addr);
		this.end("QUIT :No data received for 10 minutes.\r\n");
	});
	conn.on('error', function (error) {
		console.error(`Error from ${addr}: ${error}`);
	});
	conn.on('close', function (had_error) {
		console.log("Connection to", addr, "closed.");
		delete aucgbot.conns[addr];
	});
	this.conns[addr] = conn;
	return conn;
};

net.Socket.prototype.writeln = function writeln(...data) {
	data = data.join("");
	if (data.length > 1022) {
		data = data.slice(0, 1022);
	}
	return this.write(data + "\r\n");
};
net.Socket.prototype.send = function send(...data) {
	if (!data.length)
		throw new TypeError("Socket.prototype.send requires at least 1 argument");
	data = data.join(" ").trim();
	if (data)
		return this.writeln(data);
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
};
aucgbot.Message.prototype = {
	bot: aucgbot,
	send: function send(...args) {
		var conn = this.conn;
		args.unshift(this.dest);
		return conn.msg.apply(conn, args);
	},
	nmsg: function nmsg(...args) {
		var conn = this.conn;
		args.unshift(this.dest);
		return conn.nmsg.apply(conn, args);
	},
	notice: function notice(...args) {
		var conn = this.conn;
		args.unshift(this.nick);
		return conn.notice.apply(conn, args);
	},
	reply: function reply(...args) {
		// don't use Array.concat, it doesn't work with the arguments object
		var conn = this.conn;
		args.unshift(this.nick), args.unshift(this.dest);
		return conn.reply.apply(conn, args);
	},
	nreply: function nreply(...args) {
		var conn = this.conn;
		args.unshift(this.nick), args.unshift(this.dest);
		return conn.nreply.apply(conn, args);
	},
	log: function _log(...args) {
		var bot = this.bot;
		args.unshift(this.conn.addr);
		bot.log.apply(bot, args);
	},
	logError: function logError(...args) {
		var bot = this.bot;
		args.unshift(this.conn.addr);
		bot.logError.apply(bot, args);
	},
	isSU: function isSU() {
		return this.bot.isSU(this);
	},
	okToKick: function okToKick() {
		return this.bot.okToKick(this);
	},
};

aucgbot.log = function log() {
	// TODO
	console.log.apply(console, arguments);
};

aucgbot.logError = function logError() {
	// TODO
	console.error.apply(console, arguments);
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
			if (e.msg === "Buffer Playback...")
				conn.zncBuffer = true;
			else if (e.msg === "Playback Complete.")
				delete conn.zncBuffer;
			return;
		}
	}

	var meping = RegExp("^@?" + conn.nick.replace(/\W/g, "\\$&") + "[:,] ?", "i"), dest = e.dest, host = e.host;

	// fix for message relay bots
	if (this.prefs["relay.check"] && this.prefs["relay.bots"].includes(nick)) {
		if (/^\* (\S+) (.+)/.test(msg)) {
			e.relay = e.nick, nick = e.nick = RegExp.$1.replace(/^(?:\[\w+\]|\w+:)|\/.+/g, ""), e.msg = RegExp.$2;
			if (!e.nick && /^(\S+) (.+)/.test(e.msg))
				e.nick = RegExp.$1, e.msg = RegExp.$2;
			if (!this.checkFlood(e)) {
				try {
					this.modMethod("onAction", [e]);
				} catch (ex) {
					console.error("error in onAction:", ex);
				}
			}
			return;
		}
		if (/^<([^>]+)> (.+)/.test(msg))
			e.msg = RegExp.$2, e.relay = nick, nick = e.nick = RegExp.$1.replace(/^(?:\[\w+\]\s*|\w+:)|\/.+/g, "");
	}

	// don't listen to bots
	if (((/bot[\d_|]*$|Serv|^bot|Op$/i.test(nick) || this.prefs.bots.includes(nick)) && nick !== conn.nick) || (host.includes("/bot/") && !e.relay)) {
		try {
			this.modMethod("onBotMsg", arguments);
		} catch (ex) {}
		return;
	}

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
	if (prefix && msg.startsWith(prefix) && msg.length > prefix.length) {
		this.parseCmd(e, msg.slice(prefix.length));
	} else if (meping.test(msg)) {
		this.parseCmd(e, msg.replace(meping, ""));
	} else if (dest === nick) {
		this.parseCmd(e, msg);
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
	var now = Date.now(), conn = e.conn, dest = e.dest, nick = e.nick, host = e.host, relay = e.relay, msg = e.msg, diff = this.prefs.flood.differentiate, lastFloodTime, floodLines, inFlood;
	if (diff) {
		if (!Object.prototype.hasOwnProperty.call(conn.flood_lines, nick)) {
			conn.flood_lines[nick] = conn.flood_lastTime[nick] = 0;
		}
		floodLines = conn.flood_lines[nick];
		lastFloodTime = conn.flood_lastTime[nick];
		inFlood = conn.flood_in[nick];
	} else {
		floodLines = conn.flood_lines;
		lastFloodTime = conn.flood_lastTime;
		inFlood = conn.flood_in;
	}
	if (now - (diff ? conn.flood_lastTime[nick] : conn.flood_lastTime) > this.prefs.flood.secs * 1000) {
		if (diff)
			conn.flood_lines[nick] = 0;
		else
			conn.flood_lines = 0;
	}
	if ((diff ? conn.flood_lines[nick] : conn.flood_lines) >= this.prefs.flood.lines && now - (diff ? conn.flood_lastTime[nick] : conn.flood_lastTime) <= this.prefs.flood.secs * 1000) {
		var kb = this.okToKick(e);
		if (diff)
			conn.flood_lastTime[nick] = now;
		else
			conn.flood_lastTime = now;
		if (diff ? conn.flood_in[nick] : conn.flood_in) {
			if (kb) {
				if (this.prefs.flood.kick)
					conn.send("KICK", dest, nick, ":No flooding!");
				if (this.prefs.flood.ban)
					conn.send("MODE", dest, "+b *!*@" + host);
			}
		} else {
			if (diff)
				conn.flood_in[nick] = true;
			else
				conn.flood_in = true;
			console.warn("[WARNING] Flood detected by", nick);
			if (kb && this.prefs.flood.kick)
				conn.send("KICK", dest, nick, ":No flooding!");
			else if (this.prefs.flood.warn && !relay)
				conn.notice(nick, "Please don't flood.");
		}
		if (this.prefs.flood.log)
			e.log("Flood", nick + (dest === nick ? "" : " in " + dest), msg);
		return true;
	}
	if (diff)
		conn.flood_in[nick] = false, conn.flood_lastTime[nick] = now, conn.flood_lines[nick]++;
	else
		conn.flood_in = false, conn.flood_lastTime = now, conn.flood_lines++;
	return false;
};
/**
 * Parse a command filtered by onMsg(). Methods can listen here through the parseCmd and cmd_* methods.
 *
 * @param {Message} e
 */
aucgbot.parseCmd = function parseCmd(e, cmdMsg) {
	let match = cmdMsg.match(/(\S+)(?:\s*(.*))?/);
	if (!match || !match[1]) {
		return;
	}
	let cmd = (e.cmd = match[1].toLowerCase());
	let args = (e.args = match[2] || "");
	let dest = e.dest, nick = e.nick, host = e.host, conn = e.conn, relay = e.relay;
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
			e.args = args.join(" ");
			e.argv = args;
			this.remoteControl(e);
		} else {
			e.log("RC ATTEMPT", nick + (relay ? ":" + relay : "") + "!" + e.ident + "@" + host + (dest === nick ? "" : " in " + dest), args.join(" "));
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
			e.reply(mods.join(", "));
		break;
	case "help":
		if (args) {
			var c = args, k = "cmd_" + c;
			for (let m in this.modules) {
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
		/* falls through */
	case "listcmds": case "cmdlist":
		var s = [];
		function listModCmds(mod) {
			for (let p in mod) {
				if (mod.hasOwnProperty(p) && p.startsWith("cmd_")) {
					s.push(p.slice(4));
				}
			}
		}
		if (args) {
			if (this.modules.hasOwnProperty(args)) {
				listModCmds(this.modules[args]);
			}
		} else {
			for (let m in this.modules) {
				if (this.modules.hasOwnProperty(m)) {
					listModCmds(this.modules[m]);
				}
			}
		}
		if (s.length > 1)
			e.reply(s.join(" "));
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
	return (d ? d + " d " : "") + (h ? h + " h " : "") + (m ? m + " min " : "") + (s ? s + " s" : "");
};

aucgbot.getHTTP = function getHTTP(uri, modname, modver, headers) {
	headers = headers || {};
	var useragent = this.useragent;
	if (modname) {
		useragent += " mod_" + modname;
		if (modver)
			useragent += "/" + modver;
	}
	headers['User-Agent'] = useragent;
	var res = request(
			uri,
			{
				"method": "GET",
				"headers": headers,
			});
	if (res.statusCode && res.statusCode >= 300) {
		console.log("the stuff", res.statusCode, res.data.toString());
		throw new this.HTTPError(res, res.data.toString());
	}
	return res.data.toString();
};

aucgbot.readFile = file => fs.readFileSync(file, 'utf8');
aucgbot.writeFile = fs.writeFileSync;

aucgbot.getJSON = function getJSON() {
	return JSON.parse(this.getHTTP.apply(this, arguments));
};
/**
 * Load a module.
 *
 * @param {string} id Module name (filename without .jsm extension).
 * @throws Error when the module cannot be loaded.
 * @return {Object} The loaded module.
 */
aucgbot.loadModule = function loadModule(id) {
	let path = "./" + id + ".jsm";
	delete require.cache[require.resolve(path)];
	let m = require(path);
	if (m && m.version) {
		this.modules[id] = m;
	} else {
		throw new Error(id + " is not a module.");
	}
	console.log("Loaded mod_" + id, m.version);
	return m;
};

/**
 * Loop through, find and execute methods in currently loaded modules.
 *
 * @param {string} id Method name.
 * @param {Array} args Arguments to pass to the method.
 * @return {boolean} Whether to stop processing the event.
 */
aucgbot.modMethod = function modMethod(id, args) {
	for (let m in this.modules) {
		if (this.modules.hasOwnProperty(m)) {
			let module = this.modules[m];
			if (typeof module === "object" && module && module.hasOwnProperty(id)) {
				let method = module[id];
				if (typeof method === "function" && method.apply(module, args))
					return true;
			}
		}
	}
	return false;
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
		nctcp("aucgbot {0} (Node.js {1}, {2}-{3})".format(this.version, process.version, process.platform, process.arch));
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
		console.warn("[WARNING] Unknown CTCP!", type);
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
	var cmd = e.rcCmd, args = e.args, argv = e.argv, dest = e.dest, nick = e.nick, conn = e.conn;
	if (cmd !== "log")
		e.log("RC", nick + (dest === nick ? "" : " in " + dest), cmd, args);
	switch (cmd) {
	case "self-destruct": // Hehe, I had to put this in :D
	case "explode":
		conn.send("QUIT :" + nick + ": 10... 9... 8... 7... 6... 5... 4... 3... 2... 1... 0... *boom*", args);
		break;
	case "die":
		conn.send("QUIT :" + nick + ":", args);
		break;
	case "join": case "leave":
		let chans = argv.shift().split(",");
		for (let i = chans.length - 1; i >= 0; i--) {
			if (!conn.chantypes.includes(chans[i][0]))
				chans[i] = "#" + chans[i];
		}
		conn.send(cmd === "join" ? "JOIN" : "PART", chans.join(","), ":" + argv.join(" "));
		break;
	case "kick":
		var chan = argv.shift(), user = argv.shift();
		if (user === conn.nick) {
			e.reply("Get me to kick myself, yeah, great idea...");
			break;
		}
		if (!conn.chantypes.includes(chan[0]))
			chan = "#" + chan;
		conn.send("KICK", chan, user, ":" + nick + ":", argv.join(" "));
		break;
	case "msg": case "privmsg": case "message":
		if (argv[0] === conn.nick) {
			e.reply(this.ERR_MSG_SELF);
			break;
		}
		conn.msg.apply(conn, argv);
		break;
	case "echo": case "say":
		e.send(args);
		break;
	case "quote": case "raw":
		conn.send(args);
		break;
	case "eval": case "js": // Dangerous!
		var res;
		try {
			res = eval(args); // jshint ignore: line
		} catch (ex) {
			res = "exception: " + ex;
		}
		if (typeof res === "function")
			res = "function " + res.name;
		if (res != null)
			e.reply(res);
		break;
	case "pref":
		e.notice("Not implemented.");
		break;
	case "log":
		e.log("LOG", nick + (dest === nick ? "" : " in " + dest), args);
		break;
	case "modload": case "loadmod":
		try {
			for (args = args.split(","); args.length;)
				this.loadModule(args.shift());
		} catch (ex) {
			e.reply(ex);
			console.error(ex.stack);
		}
		break;
	case "reload":
		delete require.cache[require.resolve('./aucgbot')];
		try {
			require('./aucgbot');
		} catch (ex) {
			e.reply(ex);
			console.error(ex.stack);
		}
		break;
	default:
		try {
			if (this.modMethod("remoteControl", arguments))
				break;
		} catch (ex) {
			console.log("error in rc:", ex);
		}
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
	if (this.prefs.suDests.includes(e.dest))
		return true;
	var suHosts = this.prefs.suHosts, host = e.host;
	if (suHosts instanceof RegExp) {
		if (suHosts.test(host))
			return true;
	}
	if (suHosts instanceof Array) {
		if (suHosts.includes(host))
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
		if (nokickNicks.includes(nick))
			return false;
	}
	if (nokickHosts instanceof RegExp) {
		if (nokickHosts.test(host))
			return false;
	}
	if (nokickHosts instanceof Array) {
		if (nokickHosts.includes(host))
			return false;
	}
	return true;
};

require("./aucgbot-utils.js");

module.exports = aucgbot;
