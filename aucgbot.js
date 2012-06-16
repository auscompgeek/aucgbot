// -*- Mode: JavaScript; tab-width: 4 -*- vim:tabstop=4:
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */
 
/* Designed to be run by JSDB <http://jsdb.org>.
 * Features:
 *	- General flood protection.
 *	- Logging.
 *	- Remote control.
 *
 * Basic usage:
 *	run("aucgbot.js");
 *	aucgbot.start();
 *
 * Advanced usage:
 *	aucgbot.nick = "nick";
 *	aucgbot.prefs[pref] = setting;
 *	aucgbot.start(server, port, pass, channels);
 */

if (!aucgbot) var aucgbot =
{	prefs:
	{	flood:
		{	lines: 6,
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
		"relay.bots": /^(lcp|bik_link|iRelayer|janus|Mingbeast|irfail|rbot|Jellycraft)$/, // regex tested against nicks to check for relay bots
		"keyboard.sendInput": true, // doesn't work on Windows?
		"keyboard.dieOnInput": false, // only if keyboard.sendInput is false
		"kick.rejoin": false,
		"kick.log": true, // on bot kicked
		// RegExps to not ban/kick nicks/hosts
		"nokick.nicks": /Tanner|Mardeg|aj00200|ChrisMorgan|JohnTHaller|Bensawsome|juju|Shadow|TMZ|aus?c(ompgeek|g|ow)|Jan|Peng|TFEF|Nightmare/,
		"nokick.hosts": /bot|spam|staff|dev|math|js|[Jj]ava[Ss]cript/,
		// regex for allowed hosts to use rc command
		suHosts: /trek|aucg|^(freenode\/)?(staff|dev)|oper|netadmin|geek|gry|bot(ter|)s|spam|^(127\.\d+\.\d+\.\d+|localhost(\.localdomain)?)$/
	},
	//cmodes: {}, // XXX Parse MODE lines.
	modules: {},
	servs: [],
	global: this
};
aucgbot.version = "3.0a1 (15 Jun 2012)";

aucgbot.start =
function startBot()
{	var args = Array.prototype.slice.call(arguments);
	for each (let server in args)
		this.connect.apply(this, server);
	this.started = Date.now();
	this.startLoop();
}
/**
 * Connect the bot. All arguments are optional.
 *
 * @param {String} serv The hostname to connect to
 * @param {Number} port The port to connect to
 * @param {String} nick Nick to use
 * @param {String} user Ident to use
 * @param {String} pass The server password to use
 * @param chans An array or string describing the channels to join on connect
 */
aucgbot.connect =
function connectBot(serv, port, nick, user, pass, chans)
{	var channels = ["#bots"], i, addr = (serv || "127.0.0.1") + ":" + (parseInt(port) || 6667);
	var serv = new Stream("net://" + addr, "rwt");
	pass && this.send(serv, "PASS", pass); pass = null;
	this.servs.push(serv); serv.nick = nick || "aucgbot"; serv.flood_lines = 0;
	this.send(serv, "NICK", serv.nick);
	this.send(serv, "USER " + (user || "aucgbot") + " 8 * :\x033\17auscompgeek's JS bot");
	if (typeof chans == "array")
		channels = chans, chans = null;
	else if (typeof chans == "string")
		channels = chans.split(","), chans = null;
	else if (!chans)
		writeln("[WARNING] No channels specified! Joining ", channels);
	else
		writeln("[WARNING] Can't join channels specified! Joining ", channels);
	for (let i in channels)
		channels[i] = /^[#&+!]/.test(channels[i]) ? channels[i] : "#" + channels[i];
	while ((ln = serv.readln()))
	{	writeln(ln);
		if (/^PING (.+)/.test(ln))
			this.send(serv, "PONG", RegExp.$1);
		else if (/^:\S+ 433 ./.test(ln))
			this.send(serv, "NICK", serv.nick += "_");
		else if (/^:\S+ 004 ./.test(ln))
		{	if (channels)
			{	this.send(serv, "JOIN", channels.join(","));
				channels = null;
			}
			break;
		}
	}
	system.gc();
}
/**
 * Start the server read line loop.
 */
aucgbot.startLoop =
function startLoop()
{	while (this.servs.length)
	{	let readyServs = system.wait(this.servs);
		for each (let serv in readyServs)
		{	if (serv.canRead)
			{	let ln = serv.readln();
				writeln(serv.hostAddress + ": " + ln);
				this.parseln(ln, serv);
				if (system.kbhit())
				{	if (this.prefs["keyboard.sendInput"])
						this.send(serv, readln());
					else if (this.prefs["keyboard.dieOnInput"])
					{	this.send(serv, "QUIT :Keyboard input.");
						sleep(500); // Give the server time to receive the QUIT message.
						serv.close();
					}
				}
			}
		}
		for (let i in this.servs)
			if (this.servs[i].eof)
			{	delete this.servs[i]; // XXX must be more robust
				system.gc();
			}
	}
}

/**
 * Parse a raw IRC line.
 *
 * @param {String} ln Raw IRC line
 * @param {Stream} serv Server connection
 */
aucgbot.parseln =
function parseIRCln(ln, serv)
{	for each (let module in this.modules)
		if (typeof module.parseln == "function")
			if (module.parseln(ln, serv))
				return;
	if (/^:(\S+)!\S+@(\S+) ./.test(ln) && RegExp.$1 == serv.nick) this.host = RegExp.$2;
	if ((lnary = /^:(\S+)!(\S+)@(\S+) PRIVMSG (\S+) :(.*)/.exec(ln)))
	{	lnary.shift();
		var at = "", dest = lnary[0];
		if (/^[#&+!]/.test(lnary[3])) at = lnary[0] + ": ", dest = lnary[3];
		this.onMsg(dest, lnary[4], lnary[0], lnary[2], at, serv);
	} else if (/^PING (.+)/.test(ln))
		this.send(serv, "PONG", RegExp.$1);
	else if (/^:(\S+)!(\S+)@(\S+) INVITE (\S+) :(\S+)/.test(ln))
	{	if (this.prefs.autoAcceptInvite) this.send(serv, "JOIN", RegExp.$5);
	} else if (/^:(\S+)!(\S+)@(\S+) NICK :(\S+)/.test(ln))
	{	if (RegExp.$1 == serv.nick) serv.nick = RegExp.$4;
	} else if (/^:(\S+)(?:!(\S+)@(\S+)|) MODE (\S+)(?: (.+)|)/.test(ln))
	{	// XXX Parse!
	} else if (/^:(\S+!\S+@\S+) KICK (\S+) (\S+) :(.*)/.test(ln) && RegExp.$3 == serv.nick)
	{	this.prefs["kick.rejoin"] && this.send(serv, "JOIN", RegExp.$2);
		this.prefs["kick.log"] && this.log(serv, "KICK", RegExp.$1, RegExp.$2, RegExp.$4);
	}
}

/**
 * Parse a PRIVMSG.
 *
 * @param {string} dest Channel or nick to send messages back
 * @param {string} msg The message
 * @param {string} nick Nick that sent the PRIVMSG
 * @param {string} host Hostname that sent the PRIVMSG
 * @param {string} at Contains "nick: " if sent to a channel, else ""
 * @param {string} serv Server hostname
 */
aucgbot.onMsg =
function onMsg(dest, msg, nick, host, at, serv)
{	var meping = RegExp("^@?" + serv.nick.replace(/\W/g, "\\$&") + "([:,!.] ?| |$)", "i"), relay = "";

	// fix for buffer playback on ZNC
	if (this.prefs.zncBufferHacks)
	{	if (nick == "***")
		{	if (msg == "Buffer playback...")
				serv.zncBuffer = true;
			else if (msg == "Playback complete")
				serv.zncBuffer = false;
			return;
		} else if (serv.zncBuffer) msg = msg.replace(/^\[[0-2]?\d:[0-5]\d(:[0-5]\d|)\] /, "");
	}

	// fix for message relay bots
	if (this.prefs["relay.check"] && nick.match(this.prefs["relay.bots"]) && /^<.+> /.test(msg))
		msg = msg.replace(/^<(.+?)> /, ""), relay = nick, nick = RegExp.$1.replace(/^\[\w+\]|\/.+/g, ""), at = nick + ": ";

	// don't listen to bots
	if ((/bot[\d_|]*$|Serv|^bot|Op$/i.test(nick) || /\/bot\//.test(host)) && !(nick == serv.nick || host == this.host || relay)) return;

	// flood protection
	if (this.prefs.flood.check && this.checkFlood(dest, msg, nick, host, serv, relay)) return;

	msg = msg.replace(/\s+/g, " ");

	for each (var module in this.modules)
		if (typeof module.onMsg == "function" && module.onMsg(dest, msg, nick, host, at, serv, relay))
			return;

	if (msg[0] == "\1") // Possible CTCP.
	{	if (/^\x01([^\1 ]+)(?: ([^\1]*)|)/.test(msg))
			this.onCTCP(RegExp.$1.toUpperCase(), RegExp.$2, nick, dest, serv);
	} else if (meping.test(msg) || !at)
	{	msg = msg.replace(meping, "").replace(/^(\S+) ?/, "");
		this.parseCmd(dest, RegExp.$1.toLowerCase(), msg, nick, host, at, serv, relay);
	} else if (this.prefs.prefix && msg.slice(0, this.prefs.prefix.length) == this.prefs.prefix)
	{	msg = msg.slice(this.prefs.prefix.length).replace(/^(\S+) ?/, "");
		this.parseCmd(dest, RegExp.$1.toLowerCase(), msg, nick, host, at, serv, relay);
	} else if (/^help!?$/i.test(msg))
		this.msg(serv, dest, at + "Welcome! To get help, please state your problem. Being specific will get you help faster.");
}
/**
 * Ensure that a message isn't part of a flood.
 *
 * @param {string} dest Channel or nick to send messages back
 * @param {string} msg The message
 * @param {string} nick Nick that sent the PRIVMSG
 * @param {string} host Hostname that sent the PRIVMSG
 * @param {Stream} serv Server connection
 * @param {string} relay Relay bot nick or ""
 * @return {boolean} True if message is part of a flood
 */
aucgbot.checkFlood =
function checkFlood(dest, msg, nick, host, serv, relay)
{	/* XXX Implement this fully. *
	 * Don't try to kick/ban if:
	 *	a) we're not in a channel,
	 *	b) the message was from us
	 *	c) the user matches one of the nokick/superuser prefs
	 -	d) the user in question has any cmodes set
	 -	e) we don't have any cmodes set on us or
	 *	f) the message was sent by a relay bot.
	 */
	if (serv.zncBuffer) return false;
	if (Date.now() - serv.flood_lastTime > this.prefs.flood.secs * 1000) serv.flood_lines = 0;
	if (serv.flood_lines >= this.prefs.flood.lines && Date.now() - serv.flood_lastTime <= this.prefs.flood.secs * 1000)
	{	var kb = !(relay || dest == nick || nick == serv.nick || host == this.host || nick.match(this.prefs["nokick.nicks"]) || host.match(this.prefs["nokick.hosts"]) || host.match(this.prefs.suHosts) /*|| serv.cmodes[dest][nick].length*/) /*&& serv.cmodes[dest][this.nick].length*/;
		serv.flood_lastTime = Date.now();
		if (serv.flood_in)
		{	if (kb)
			{	this.prefs.flood.kick && this.send(serv, "KICK", dest, nick, ":No flooding!");
				this.prefs.flood.ban && this.send(serv, "MODE", dest, "+b *!*@" + host);
			}
		} else
		{	serv.flood_in = true;
			writeln("[WARNING] Flood detected!");
			kb && this.prefs.flood.kick ? this.send(serv, "KICK", dest, nick, ":No flooding!") :
			this.prefs.flood.warn && !relay && this.send(serv, "NOTICE", nick, ":Please don't flood.");
		}
		this.prefs.flood.log && this.log(serv, "Flood", nick + (dest == nick ? "" : " in " + dest), msg);
		return true;
	}
	serv.flood_in = false;
	serv.flood_lastTime = Date.now();
	serv.flood_lines++;
}
/**
 * Parse a command filtered by onMsg().
 *
 * @param {string} dest Channel or nick to send messages back
 * @param {string} cmd Command name
 * @param {string} args Any arguments
 * @param {string} nick Nick that sent the PRIVMSG
 * @param {string} host Hostname that sent the PRIVMSG
 * @param {string} at Contains "nick: " if sent to a channel, else ""
 * @param {string} serv Server hostname
 * @param {string} relay Relay bot nick or ""
 */
aucgbot.parseCmd =
function parseCmd(dest, cmd, args, nick, host, at, serv, relay)
{	if (cmd == "ping") this.msg(serv, dest, at + "pong", args);
	if (cmd == "version") this.msg(serv, dest, at + this.version);
	if (cmd == "rc" && host.match(this.prefs.suHosts))
		this.remoteControl(args.split(" ")[0], args.replace(/^(\S+) /, ""), dest, at, nick, serv);
	if (/stat|uptime/.test(cmd))
		this.msg(serv, dest, at + "I've been up " + this.up() + ".");
	if (/listmods|modlist/.test(cmd)) 
	{	var modlist = [];
		for (var i in this.modules) modlist.push(i + " " + this.modules[i].version);
		this.msg(serv, dest, at + "Modules loaded: " + modlist.join(", "));
	}

	for each (var module in this.modules)
		if (typeof module["cmd_" + cmd] == "function" && module["cmd_" + cmd].apply(module, arguments))
			return;
}
/**
 * Get the uptime of the bot.
 *
 * @author Ogmios
 * @return {string} Uptime in human readable format
 */
aucgbot.up =
function uptime()
{	var diff = Math.round((Date.now() - this.started) / 1000),
		s = diff % 60, m = (diff % 3600 - s) / 60,
		h = Math.floor(diff / 3600) % 24, d = Math.floor(diff / 86400);
	return (d ? d + "d " : "") + (h ? h + "h " : "") + (m ? m + "m " : "") + s + "s";
}
/**
 * Parse a CTCP request.
 *
 * @param {string} type CTCP request type
 * @param {string} msg Any arguments
 * @param {string} nick Nick of the requestee
 * @param {string} dest Channel to which the request was sent (`nick` if sent directly to us)
 * @param {Stream} serv Server connection
 */
aucgbot.onCTCP =
function onCTCP(type, msg, nick, dest, serv)
{	for each (var module in this.modules)
		if (typeof module.onCTCP == "function" && module.onCTCP.apply(module, arguments))
			return;
	switch (type)
	{	case "ACTION":
			var res =
			[	"\1ACTION slaps " + nick + " around a bit with a large trout\1",
				"\1ACTION slaps " + nick + " around a bit with a small fish\1",
				nick + "! Look over there! *slap*",
				"\1ACTION gets the battering hammer and bashes " + nick + " with it\1",
				"\1ACTION bashes " + nick + " with a terrifying Windows ME user guide\1",
				"\1ACTION beats " + nick + " to a pulp\1",
				"\1ACTION hits " + nick + " with an enormous Compaq laptop\1",
				"\1ACTION hits " + nick + " with a breath taking Windows ME user guide\1",
				"\1ACTION smacks " + nick + "\1",
				"\1ACTION trips up " + nick + " and laughs\1",
				"\1ACTION uses his 1337ness against " + nick + "\1",
				"\1ACTION slaps " + nick + ", therefore adding to his aggressiveness stats\1",
				"\1ACTION pokes " + nick + " in the ribs\1",
				"\1ACTION drops a fully grown whale on " + nick + "\1",
				"\1ACTION whacks " + nick + " with a piece of someone's floorboard\1",
				"\1ACTION slaps " + nick + " with IE6\1",
				"\1ACTION trout slaps " + nick + "\1",
				"\1ACTION hits " + nick + " over the head with a hammer\1",
				"\1ACTION slaps " + nick + "\1",
				"\1ACTION slaps " + nick + " with a trout\1",
				"\1ACTION whacks " + nick + " with a suspicious brick\1",
				"\1ACTION puts " + nick + "'s fingers in a Chinese finger lock\1",
				"\1ACTION randomly slaps " + nick + "\1",
				"\1ACTION pies " + nick + "\1",
				"Hey! Stop it!", "Go away!", "GETOFF!",
				"Mooooooooooo!", "MOO!", "Moo.", "Moo. Moo.", "Moo Moo Moo, Moo Moo.", "fish go m00!",
				"\1ACTION nibbles on some grass\1",
				"\1ACTION goes and gets a drink\1",
				"\1ACTION looks in the " + dest + " fridge\1",
				"\1ACTION quietly meditates on the purpose of " + dest + "\1",
				"\1ACTION races across the channel\1",
				"\1ACTION runs around in circles and falls over\1",
				"\1ACTION wanders aimlessly\1",
				"\1ACTION eyes " + nick + " menacingly\1",
				"\1ACTION sniffs " + nick + "\1",
				"\1ACTION thumps " + nick + "\1",
				"\1ACTION solves partial differential equations\1"
			];
			msg.match("(hit|kick|slap|eat|prod|stab|kill|whack|insult|teabag|(punch|bash|touch|pok)e)s " +
				this.nick.replace(/\W/g, "\\$&") + "\\b", "i") &&
				this.msg(serv, dest, res[ranint(0, res.length - 1)]);
			break;
		case "VERSION":
			nctcp(nick, type, "aucg's JS IRC bot v" + this.version +
					" (JSDB " + system.release + ", JS " + (system.version / 100) + ")");
			break;
		case "TIME":
			nctcp(nick, type, new Date());
			break;
		case "SOURCE":
		case "URL":
			nctcp(nick, type, "https://github.com/auscompgeek/aucgbot on http://jsdb.org");
			break;
		case "PING":
			nctcp(nick, type, msg);
			break;
		case "UPTIME":
		case "AGE":
			nctcp(nick, type, this.up());
			break;
		case "GENDER":
		case "SEX":
			nctcp(nick, type, "bot");
			break;
		case "LOCATION":
			nctcp(nick, type, "behind you");
			break;
		case "A/S/L":
		case "ASL":
			nctcp(nick, type, "2/bot/behind you");
			break;
		case "AVATAR":
		case "ICON":
		case "FACE":
			break;
		case "LANGUAGES":
		case "LANGUAGE":
			nctcp(nick, type, "JS,en");
			break;
		default:
			writeln("[ERROR] Unknown CTCP! ^^^^^");
			this.log(serv, "CTCP", nick + (nick == dest ? "" : " in " + dest), type, msg);
	}
	function nctcp(nick, type, msg) aucgbot.send(serv, "NOTICE", nick, ":\1" + type, msg + "\1");
}
/**
 * Parses a control signal from a user with remote control privileges.
 *
 * @param {string} cmd Command
 * @param {string} args Any arguments
 * @param {string} dest Channel or nick to send messages back
 * @param {string} at Contains "nick: " if sent to a channel, else ""
 * @param {string} nick Nick that sent the signal
 * @param {Stream} serv Server connection
 */
aucgbot.remoteControl =
function rcBot(cmd, args, dest, at, nick, serv)
{	this.log(serv, "RC", nick + (at ? " in " + dest : ""), cmd + (args ? " " + args : ""));
	switch (cmd)
	{	case "self-destruct": // Hehe, I had to put this in :D
		case "explode":
			this.send(serv, "QUIT :" + at, "10... 9... 8... 7... 6... 5... 4... 3... 2... 1... 0... *boom*", args);
			break;
		case "die":
			this.send(serv, "QUIT :" + at + args);
			sleep(500);
			serv.close();
			break;
		/*case "connect":
			var argary = /^(?:irc:\/\/|)(\w[\w.-]+\w)(?::([1-5]\d{0,4}|[6-9]\d{0,3}|6[0-5]{2}[0-3][0-5])|)(?:\/([^?]*)|)(?:\?pass=(.+)|)$/.exec(args);
			if (!argary) // Invalid URL?!?!?
			{	writeln("[ERROR] Invalid URL! ^^^^^");
				this.log(serv, "Invalid URL", nick + (at ? " in " + dest : ""), args);
				break;
			}
			argary.shift();
			this.connect(argary[0], argary[1], serv.nick, "", "", argary[3], argary[2]);
			break;*/
		case "join":
			args = args.split(",");
			for (var i in args) args[i] = /^[#&+!]/.test(args[i]) ? args[i] : "#" + args[i];
			this.send(serv, "JOIN", args.join(","));
			break;
		case "leave":
			var args = args.split(" "), chans = args.shift().split(",");
			for (var i in chans) chans[i] = /^[#&+!]/.test(chans[i]) ? chans[i] : "#" + chans[i];
			this.send(serv, "PART", chans.join(","), ":" + at + args.join(" "));
			break;
		case "kick":
			var s = args.split(" "), chan = s.shift();
			if (s[0] == this.nick)
			{	this.msg(serv, dest, at + "Get me to kick myself, yeah, great idea...");
				this.log(serv, "RC abuse", nick + (at ? " in " + dest : ""), "kick " + args);
				break;
			}
			if (/^[^#&+!]/.test(chan)) chan = "#" + chan;
			this.send(serv, "KICK", chan, s.shift(), ":" + at + s.join(" "));
			break;
		case "msg":
		case "privmsg":
		case "message":
			var s = args.split(" ");
			if (s[0] == this.nick)
			{	this.msg(dest, at + "Get me to talk to myself, yeah, great idea...");
				this.prefs.abuse.log && this.log(serv, "RC abuse", nick + (at ? " in " + dest : ""), cmd + " " + args);
				break;
			}
			this.msg.apply(this, s);
			break;
		case "echo":
		case "say":
			this.msg(dest, args);
			break;
		case "quote":
		case "raw":
			this.send(args);
			break;
		case "eval":
		case "js": // Dangerous!
			if (/(stringify|uneval).*(aucgbot|this|global)/i.test(args))
			{	writeln("[WARNING] Possible abuse! ^^^^^");
				this.log(serv, "RC abuse", nick + (at ? " in " + dest : ""), cmd + (args ? " " + args : ""));
				this.send(serv, "NOTICE", nick, ":Please don't try to abuse my remote control.");
				break;
			}
			try { var res = eval(args) } catch (ex) { res = "exception: " + ex }
			if (typeof res == "function") res = "function";
			res && this.msg(serv, dest, at + res);
			break;
		/*case "pref":
			var args = args.split(" ");
			if (this.prefs[args[0]] == undefined)
			{	this.send("NOTICE", nick)
			}*/
		case "log":
			this.log(serv, "LOG", nick + (at ? " in " + dest : ""), args);
			break;
		case "modload":
		case "loadmod":
			module = {}; // must leak to global scope to reach module itself
			try
			{	run(args + ".jsm");
				module.version ? this.modules[args] = module : this.msg(serv, dest, at + "Not a module.");
			} catch (ex) { this.msg(serv, dest, at + "Could not load", args + ":", ex) }
			delete this.global.module;
			break;
		case "reload":
			if (!run("aucgbot.js"))
			{	this.msg(serv, dest, at + "I can't find myself!");
				this.log(serv, nick + (at ? " in " + dest : ""), "Can't reload aucgbot!");
			}
			break;
		default:
			writeln("[ERROR] Possible abuse attempt! ^^^^^");
			this.send(serv, "NOTICE", nick, ":Hmm? Didn't quite get that.");
	}
}

aucgbot.send =
function send()
{	var s = Array.prototype.slice.call(arguments);
	if (!s.length) throw new TypeError("aucgbot.send() requires more than 0 arguments");
	return s.shift().writeln(s.join(" ").replace(/\s+/, " ").replace(/^ | $/g, ""));
}
aucgbot.msg =
function msg()
{	var s = Array.prototype.slice.call(arguments), serv = s.shift();
	if (s.length < 2) throw new TypeError("aucgbot.msg() requires more than 3 arguments");
	s[1] = ":" + s[1]; s.unshift("PRIVMSG"); s.unshift(serv);
	return this.send.apply(this, s);
}
aucgbot.log =
function log(serv)
{	if (!this.prefs.log) return;
	var s = [serv.hostAddress, Date.now()], log;
	for (var i = 1; i < arguments.length; i++)
		s[i + 1] = arguments[i];
	if (s.length < 2) throw new TypeError("aucgbot.log() requires more than 2 arguments");
	log = new Stream("aucgbot.log", "a");
	log.writeln(s.join(": ").replace(/\s+/, " ").replace(/^ | $/g, ""));
	log.close();
}

/**
 * Utility function to generate a (psuedo-)random number.
 *
 * @param {number} min Minimum number
 * @param {number} max Maximum number
 */
function ranint(min, max)
{	min = min != null ? min : 1;
	max = max != null ? max : 10;
	if (min >= max) return NaN;
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

writeln("aucgbot loaded.");