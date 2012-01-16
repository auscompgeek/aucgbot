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
			log: true,
			kick: true, // not if message was relayed
			ban: false, // during flood
			warn: false // warn user sending message in PM when flood starts
		},
		log: true, // toggle all logging
		prefix: "\\\\", // command prefix
		zncBufferHacks: false, // use ZNC buffer timestamps hack
		"relay.check": true, // toggle relay bot checking
		"relay.bots": /^(lcp|bik_link|iRelayer|janus|Mingbeast|irfail|rbot)$/, // regex tested against nicks to check for relay bots
		"keyboard.sendInput": true, // doesn't work on Windows?
		"keyboard.dieOnInput": false, // only if keyboard.sendInput is false
		"kick.rejoin": false,
		"kick.log": true, // on bot kicked
		// RegExps to not ban/kick nicks/hosts
		"nokick.nicks": /Tanner|Mardeg|aj00200|ChrisMorgan|JohnTHaller|Bensawsome|juju|Shadow|TMZ|aus?c(ompgeek|g|ow)|Jan/,
		"nokick.hosts": /bot|spam|staff|dev|math|js|[Jj]ava[Ss]cript/,
		// regex for allowed hosts to use rc command
		suHosts: /trek|aucg|^(freenode\/)?(staff|dev)|oper|netadmin|geek|gry|bot(ter|)s|spam|^(127\.\d+\.\d+\.\d+|localhost(\.localdomain)?)$/
	},
	//cmodes: {}, // XXX Parse MODE lines.
	modules: {},
	lines: 0,
	version: "2.2 (15 Jan 2012)"
};

/**
 * Start the bot. All arguments are optional.
 *
 * @param {string} serv The hostname to connect to
 * @param {number} port The port to connect to
 * @param {string} pass The server password to use
 * @param chans An array or string describing the channels to join on connect
 */
aucgbot.start =
function startBot(serv, port, pass, chans)
{	var channels = ["#bots"], i;
	this.started = Date.now();
	serv = serv || "127.0.0.1"; port = parseInt(port) || 6667;
	this.nick = this.nick || "aucgbot";
	this.serv = new Stream("net://" + serv + ":" + port); // XXX Add multi-server support.
	pass && this.send("PASS", pass); pass = port = null;
	this.send("NICK", this.nick);
	this.send("USER aucgbot 8 * :\x033\17auscompgeek's JS bot");
	if (typeof chans == "array")
		channels = chans, chans = null;
	else if (typeof chans == "string")
		channels = chans.split(","), chans = null;
	else if (!chans)
		writeln("[WARNING] No channels specified! Joining ", channels);
	else
		writeln("[WARNING] Can't join channels specified! Joining ", channels);
	for (i = 0; i < channels.length; i++)
		channels[i] = /^[#&+!]/.test(channels[i]) ? channels[i] : "#" + channels[i];
	while ((ln = this.serv.readln()))
	{	writeln(ln);
		if (/^PING (.+)/.test(ln))
			this.send("PONG", RegExp.$1);
		else if (/^:\S+ 004 ./.test(ln))
		{	if (channels)
			{	this.send("JOIN", channels.join(","));
				channels = null;
			}
			break;
		}
	}
	system.gc();
	this.startLoop(serv);
}
/**
 * Start the server read line loop.
 *
 * @param {string} serv Server hostname
 */
aucgbot.startLoop =
function startLoop(serv)
{	while (!this.serv.eof && (ln = this.serv.readln()))
	{	writeln(ln);
		this.parseln(ln, serv);
		if (system.kbhit())
		{	if (this.prefs["keyboard.sendInput"])
				this.send(readln());
			else if (this.prefs["keyboard.dieOnInput"])
			{	this.send("QUIT :Keyboard input.");
				sleep(500); // Give the server time to receive the QUIT message.
				this.serv.close();
			}
		}
	}
}

/**
 * Parse a raw IRC line.
 *
 * @param {string} ln Raw IRC line
 * @param {string} serv Server hostname
 */
aucgbot.parseln =
function parseIRCln(ln, serv)
{	for (i in this.modules)
		if (typeof this.modules[i].parseln == "function")
			if (this.modules[i].parseln(ln, serv))
				return;
	if (/^:(\S+)!\S+@(\S+) ./.test(ln) && RegExp.$1 == this.nick) this.host = RegExp.$2;
	if ((lnary = /^:(\S+)!(\S+)@(\S+) PRIVMSG (\S+) :(.*)/.exec(ln)))
	{	lnary.shift();
		var at = "", dest = lnary[0];
		if (/^[#&+!]/.test(lnary[3])) at = lnary[0] + ": ", dest = lnary[3];
		this.onMsg(dest, lnary[4], lnary[0], lnary[2], at, serv);
	} else if (/^PING (.+)/.test(ln))
		this.send("PONG", RegExp.$1);
	else if (/^:(\S+)!(\S+)@(\S+) INVITE (\S+) :(\S+)/.test(ln))
		this.send("JOIN", RegExp.$5);
	else if (/^:(\S+)!(\S+)@(\S+) NICK :(\S+)/.test(ln))
	{	if (RegExp.$1 == this.nick) this.nick = RegExp.$4;
	} else if (/^:(\S+)(?:!(\S+)@(\S+)|) MODE (\S+)(?: (.+)|)/.test(ln))
	{	// XXX Parse!
	} else if (/^:([^!@ ]![^!@ ]@[^! ]) KICK (\S+) (\S+) :(.*)/.test(ln) && RegExp.$3 == this.nick)
	{	this.prefs["kick.rejoin"] && this.send("JOIN", RegExp.$2);
		this.prefs["kick.log"] && this.log(serv, "KICK", RegExp.$1, RegExp.$2, RegExp.$4);
	} else if (/^:\S+ 433 \* ./.test(ln)) // Nick collision on connect.
	{	this.nick += "_";
		this.send("NICK", this.nick);
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
{	/* XXX Implement this fully. *
	 * Don't try to kick/ban if:
	 *	a) we're not in a channel,
	 *	b) the message was from us
	 *	c) the user matches one of the nokick/superuser prefs
	 -	d) the user in question has any cmodes set
	 -	e) we don't have any cmodes set on us or
	 *	f) the message was sent by a relay bot.
	 */
	var fromUs = host == this.host || nick == this.nick,
		kb = at && !(fromUs || nick.match(this.prefs["nokick.nicks"]) || host.match(this.prefs["nokick.hosts"]) || host.match(this.prefs.suHosts) /*|| this.cmodes[dest][nick] != []*/) /*&& this.cmodes[dest][this.nick] == []*/,
		meping = RegExp("^@?" + this.nick.replace(/\W/g, "\\$&") + "([:,!.] ?| |$)", "i"),
		relay = "", now = Date.now();

	// fix for buffer playback on ZNC
	if (this.prefs.zncBufferHacks)
	{	if (nick == "***")
		{	if (msg == "Buffer playback...")
				this.buffer = true;
			else if (msg == "Playback complete")
				this.buffer = false;
			return;
		} else if (this.buffer) msg = msg.replace(/^\[[0-2]?\d:[0-5]\d(:[0-5]\d|)\] /, "");
	}

	// fix for message relay bots
	if (this.prefs["relay.check"] && nick.match(this.prefs["relay.bots"]) && /^<.+> /.test(msg))
		msg = msg.replace(/^<(.+?)> /, ""), relay = nick, nick = RegExp.$1, at = nick + ": ",
		kb = true, fromUs = nick == this.nick || fromUs;

	// don't listen to bots
	if ((/^bot|bot[\d_|]*$|Serv|Op$/i.test(nick) || /\/bot\//.test(host)) && !fromUs && !relay) return;

	// flood protection
	if (!this.buffer)
	{	if (now - this.lastTime > this.prefs.flood.secs * 1000) this.lines = 0;
		if (this.lines >= this.prefs.flood.lines && now - this.lastTime <= this.prefs.flood.secs * 1000)
		{	this.lastTime = now;
			if (this.flood)
			{	if (kb)
				{	this.prefs.flood.kick && this.send("KICK", dest, nick, ":No flooding!");
					this.prefs.flood.ban && this.send("MODE", dest, "+b *!*@" + host);
				}
			} else
			{	this.flood = true;
				writeln("[WARNING] Flood detected!");
				kb && this.prefs.flood.kick ? this.send("KICK", dest, nick, ":No flooding!") :
				this.prefs.flood.warn && !relay && this.send("NOTICE", nick, ":Please don't flood.");
			}
			this.prefs.flood.log && this.log(serv, "Flood", nick + (at ? " in " + dest : ""), msg);
			return;
		}
		this.flood = false;
		this.lastTime = now;
		this.lines++;
	}

	msg = msg.replace(/\s+/g, " ");

	for (i in this.modules)
		if (typeof this.modules[i].onMsg == "function")
			if (this.modules[i].onMsg(dest, msg, nick, host, at, serv, relay))
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
		this.msg(dest, at + "Welcome! To get help, please state your problem. Being specific will get you help faster.");
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
 */
aucgbot.parseCmd =
function parseCmd(dest, cmd, args, nick, host, at, serv, relay)
{	if (cmd == "ping") this.msg(dest, at + "pong", args);
	if (cmd == "version") this.msg(dest, at + this.version);
	if (cmd == "rc" && host.match(this.prefs.suHosts))
		this.remoteControl(args.split(" ")[0], args.replace(/^(\S+) /, ""), dest, at, nick, serv);
	if (/stat|uptime/.test(cmd))
		this.msg(dest, at + "I've been up " + this.up() + ".");
	if (/listmods|modlist/.test(cmd)) 
	{	var modlist = [];
		for (var i in this.modules) modlist.push(i + " " + this.modules[i].version);
		this.msg(dest, at + "Modules loaded: " + modlist.join(", "));
	}

	for (var i in this.modules)
		if (typeof this.modules[i]["cmd_" + cmd] == "function")
			if (this.modules[i]["cmd_" + cmd](dest, args, nick, host, at, serv, relay))
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
{	var diff = Math.round((this.lastTime - this.started) / 1000),
		s = diff % 60,
		m = (diff % 3600 - s) / 60,
		h = Math.floor(diff / 3600) % 24,
		d = Math.floor(diff / 3600 / 24);
	return (d ? d + "d " : "") + (h ? h + "h " : "") + (m ? m + "m " : "") + s + "s";
}
/**
 * Parse a CTCP request.
 *
 * @param {string} type CTCP request type
 * @param {string} msg Any arguments
 * @param {string} nick Nick of the requestee
 * @param {string} dest Channel to which the request was sent (`nick` if sent directly to us)
 * @param {string} serv Server hostname
 */
aucgbot.onCTCP =
function onCTCP(type, msg, nick, dest, serv)
{	switch (type)
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
				this.msg(dest, ":" + res[ranint(0, res.length - 1)]);
			break;
		case "VERSION":
			nctcp(nick, type, "aucg's JS IRC bot " + this.version +
					" (JSDB " + system.release + ", JS " + (system.version / 100) + ")");
			break;
		case "TIME":
			nctcp(nick, type, new Date());
			break;
		case "SOURCE":
		case "URL":
			nctcp(nick, type, "http://eu.gshellz.org/~aucg/aucgbot.js on http://jsdb.org");
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
			nctcp(nick, type, "2m/bot/behind you");
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
	function nctcp(nick, type, msg) aucgbot.send("NOTICE", nick, ":\1" + type, msg + "\1");
}
/**
 * Parses a control signal from a user with remote control privileges.
 *
 * @param {string} cmd Command
 * @param {string} args Any arguments
 * @param {string} dest Channel or nick to send messages back
 * @param {string} at Contains "nick: " if sent to a channel, else ""
 * @param {string} nick Nick that sent the signal
 * @param {string} serv Server hostname
 */
aucgbot.remoteControl =
function rcBot(cmd, args, dest, at, nick, serv)
{	switch (cmd)
	{	case "self-destruct": // Hehe, I had to put this in :D
		case "explode":
			this.send("QUIT :" + at, "10... 9... 8... 7... 6... 5... 4... 3... 2... 1... 0... *boom*", args);
			break;
		case "die":
			this.send("QUIT :" + at + args);
			sleep(500);
			this.serv.close();
			break;
		case "connect": // Might cause a memory leak. Used to quit & connect elsewhere.
			var argary = /^(?:irc:\/\/|)(\w[\w.-]+\w)(?::([1-5]\d{0,4}|[6-9]\d{0,3}|6[0-5]{2}[0-3][0-5])|)(?:\/([^?]*)|)(?:\?pass=(.+)|)$/.exec(args);
			if (!argary) // Invalid URL?!?!?
			{	writeln("[ERROR] Invalid URL! ^^^^^");
				this.log(serv, "Invalid URL", nick + (at ? " in " + dest : ""), args);
				break;
			}
			argary.shift();
			this.send("QUIT :I was asked to connect to another server by", nick + ".");
			this.start(argary[0], argary[1], "", argary[3], argary[2]);
			break;
		case "join":
			args = args.split(",");
			for (var i = 0; i < args.length; i++)
				args[i] = /^[#&+!]/.test(args[i]) ? args[i] : "#" + args[i];
			this.send("JOIN", args.join(","));
			break;
		case "leave":
			var args = args.split(" "),
				chans = args.shift().split(",");
			for (var i = 0; i < args.length; i++)
				args[i] = /^[#&+!]/.test(args[i]) ? args[i] : "#" + args[i];
			this.send("PART", chans.join(","), ":" + at + args.join(" "));
			break;
		case "kick":
			var s = args.split(" "),
				chan = argary.shift();
			if (s[0] == this.nick)
			{	this.msg(dest, at + "Get me to kick myself, yeah, great idea...");
				this.log(serv, "RC abuse", nick + (at ? " in " + dest : ""), "kick " + args);
				break;
			}
			if (/^[^#&+!]/.test(chan)) chan = "#" + chan;
			this.send("KICK", chan, s.shift(), ":" + at + s.join(" "));
			break;
		case "msg":
		case "privmsg":
		case "message":
			var s = args.split(" ");
			if (s[0] == this.nick)
			{	this.msg(dest, at + "Get me to talk to myself, yeah, great idea...");
				this.prefs.abuse.log && this.log(serv, "RC abuse", nick + (at ? " in " + dest : ""), cmd + (args ? " " + args : ""));
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
			if (/uneval.*\(.*(aucgbot|this).*\)/i.test(args))
			{	writeln("[WARNING] Possible abuse! ^^^^^");
				this.log(serv, "RC abuse", nick + (at ? " in " + dest : ""), cmd + (args ? " " + args : ""));
				this.send("NOTICE", nick, ":Please don't try to abuse my remote control.");
				break;
			}
			try { var res = eval(args) } catch (ex) { res = "uncaught exception: " + ex }
			if (typeof res == "function") res = "function";
			res && this.msg(dest, at + res);
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
			module = {};
			try
			{	run(args + ".jsm");
				module.version ? this.modules[args] = module : this.msg(dest, at + "Not a module.");
			} catch (ex) { this.msg(dest, at + "Could not load", args + ":", ex) }
			break;
		case "reload":
			if (!run("aucgbot.js"))
			{	this.msg(dest, at + "I can't find myself!");
				this.log(serv, nick + (at ? " in " + dest : ""), "Can't reload aucgbot!");
			}
			break;
		default:
			writeln("[ERROR] Possible abuse! ^^^^^");
			this.log(serv, "RC abuse", nick + (at ? " in " + dest : ""), cmd + (args ? " " + args : ""));
			this.send("NOTICE", nick, ":Hmm? Didn't quite get that.");
	}
}

aucgbot.send =
function send()
{	var s = Array.prototype.slice.call(arguments);
	if (!s.length) throw new TypeError("send requires more than " + arguments.length + " arguments");
	return this.serv.writeln(s.join(" ").replace(/\s+/, " ").replace(/^ | $/g, ""));
}
aucgbot.msg =
function msg()
{	var s = Array.prototype.slice.call(arguments);
	if (s.length < 2) throw new TypeError("msg requires more than " + arguments.length + " arguments");
	s[1] = ":" + s[1];
	s.unshift("PRIVMSG");
	return this.send.apply(this, s);
}
aucgbot.log =
function log(serv)
{	if (!this.prefs.log) return;
	var s = [serv, this.lastTime], log;
	for (var i = 1; i < arguments.length; i++)
		s[i + 1] = arguments[i];
	if (s.length < 2) throw new TypeError("log requires more than " + arguments.length + " arguments");
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

writeln("Type aucgbot.start(serv,port,pass,chans) to start the bot.");