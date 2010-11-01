/* -*- Mode: JavaScript; tab-width: 4 -*- vim:tabstop=4:
 * ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is JS IRC Calculator Bot.
 *
 * The Initial Developer of the Original Code is
 * Netscape Communications Corporation.
 * Portions created by the Initial Developer are Copyright (C) 1998
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   David Vo, David.Vo2@gmail.com, original author
 *   Michael, oldiesmann@oldiesmann.us, bug finder!
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK *****
 * Designed to be run by JSDB <http://jsdb.org>.
 * Features:
 *	- General flood protection.
 *	- Error reporting.
 *	- Logging.
 *	- Remote control.
 *	- Dice.
 *	- Temperature conversion.
 *
 * Basic usage:
 *	calcbot.init();
 *	calcbot.start();
 *
 * Advanced usage:
 *	calcbot.init();
 *	calcbot.nick = "nick";
 *	calcbot.prefs[pref] = setting;
 *	calcbot.start(server, port, ident, pass, channels);
 *
 * TODO:
 *	- Fix "pow(pow(a,b),c) ** x"!
 *	- Multi-network support.
 *	- Parse NAMES, MODEs e.g. +o, 005.
 *	- SSL support.
 */

if (!calcbot) var calcbot =
{	prefs: { abuse: {}, flood: {}, error: {} },
	cmodes: {}, // XXX Parse MODE lines.
	lines: 0,
	list: "Functions [<x>()]: acos, asin, atan, atan2, cos, sin, tan, exp, log, pow, sqrt, abs, ceil, max, min, floor, round, random, ranint, fact, mean, dice, f, c. Constants: e, pi, phi. Operators: %, ^, **. Other: decimal, source.",
	abuse: /load|java|ecma|op|.help|.ping|doc|cli|(qui|exi|aler|prin|insul|.lis)t|undef|raw|throw|window|nan|open|con|pro|patch|plug|play|infinity|my|var|for|function|(fals|minimi[sz]|dat|los|whil|writ|tru|typ)e|this|js|sys|scr|(de|loca|unti|rctr|eva)l|[\["\]]|([^<>=]|^)=|([^w]hat|[^h]at|[^a]t|[^t]|^)'([^s]|$)/
}, ans;
calcbot.init =
function initBot()
{	this.version = "0.17 (26 Oct 2010)";
	this.help = "This is aucg's JS calc bot v" + this.version + ". Usage: =<expr>. " + this.list + " Type =?<topic> for more information.";
	this.prefs =
	{	error:
		{	log: true,
			sendError: true,
			apologise: false,
			apologymsg: "Sorry, I encountered an error while trying to evaluate your expression."
		},
		fixZNCBuffer: false,
		userfriendly: false,
		abuse:
		{	log: true, // when triggered with =
			"log.ctcp": true,
			"log.ping": true,
			"log.pm": true,
			kick: false, // only if user used =, not if message was relayed
			ban: false,
			warn: true // warn user sending message
		},
		flood:
		{	lines: 6,
			seconds: 4,
			log: true,
			kick: true, // not if message was relayed
			ban: false, // during flood
			warn: false // warn user sending message in PM when flood starts
		},
		actDice: false, // display output of <x>d<y> as /me rolls a d<y> x times: a, b, c, total: d
		log: true, // toggle all logging
		"relay.check": true, // toggle relay bot checking
		"relay.bots": /^(lcp|bik_link|iRelayer|janus|Mingbeast|irfail)$/, // regex tested against nicks to check for relay bots
		italicsInHelp: false, // tested ONLY in ChatZilla, doesn't work in irssi
		"keyboard.sendInput": true, // XXX Doesn't work on Windows?
		"keyboard.dieOnInput": false, // if keyboard.sendInput is false
		easterEggs: true, // toggle Easter eggs :-)
		rejoinOnKick: false,
		// RegExps to not ban/kick nicks/hosts
		"nokick.nicks": /Tanner|Mardeg|aj00200|ChrisMorgan|JohnTHaller|Bensawsome|juju|Shadow|TMZ|aus?c(ompgeek|g|ow)|Jan/,
		"nokick.hosts": /bot|spam|staff|developer|math/,
		// regex for allowed hosts to use =rctrl command
		"superuser.hosts": /support\.team\.at\.shellium\.org|trek|aus?c(ompgeek|g)|^(FOSSnet|freenode)\/(staff|dev)|oper|netadmin|[Gg]ryllida|bot(ter|)s|spam|\.net\.pbthawe\.eu/
	};
	return "Calc bot initialised. Type calcbot.start(serv,port,user,pass,chans) to start the bot.";
}

calcbot.start =
function startBot(serv, port, user, pass, chans)
{	var channels = "bots";
	this.started = new Date().getTime();
	serv = serv || "localhost"; port = parseInt(port) || 6667;
	this.nick = this.nick || "aucgbot";
	system.gc();
	try
	{	this.serv = new Stream("net://" + serv + ":" + port); // XXX Add multi-server support.
		pass && this.send(serv, "PASS", pass); pass = 0;
		this.send(serv, "NICK", this.nick);
		this.send(serv, "USER", user || "aucg", "8 * :\x033\17auscompgeek's JS calc bot, see =help");
		if (typeof chans == "array")
			for (var i = 0; i <= chans.length; i++)
				if (i == 0)
					channels = chans[0];
				else
					channels += "," + (/^[#&+!]/.test(chans) ? chans[i] : "#" + chans[i]);
		else if (typeof chans == "string")
			channels = chans;
		else if (!chans)
			writeln("[WARNING] No channels specified! Joining " + channels);
		else
			writeln("[WARNING] Can't join channels specified! Joining " + channels);
		if (/^[^#&+!]/.test(channels)) channels = "#" + channels;
		while ((ln = this.serv.readln()))
		{	writeln(ln);
			if (channels && /^:\S+ 005 /.test(ln) && this.send(serv, "JOIN", channels))
				channels = 0;
			else
				this.parseln(ln, serv);
			if (this.prefs["keyboard.sendInput"] && system.kbhit())
				this.send(serv, readln());
			else if (this.prefs["keyboard.dieOnInput"] && system.kbhit())
				this.send(serv, "QUIT :Keyboard input.");
		}
	} catch(ex) { writeln("FATAL ERROR: Operation succeeded: ", ex); }
}

calcbot.parseln =
function parseIRCln(ln, serv)
{	if (/^:(\S+)!\S+@(\S+) ./.test(ln) && RegExp.$1 == this.nick) this.host = RegExp.$2;
	if ((lnary = /^:(\S+)!(\S+)@(\S+) PRIVMSG (\S+) :(.*)/.exec(ln)))
	{	lnary.shift();
		var at = "", dest = lnary[0];
		if (/^[#&+!]/.test(lnary[3])) at = lnary[0] + ": ", dest = lnary[3];
		this.onMsg(dest, lnary[4], lnary[0], lnary[2], at, serv);
	} else if (/^PING (.+)/.test(ln))
		this.send(serv, "PONG", RegExp.$1);
	else if (/^:(\S+)!(\S+)@(\S+) INVITE (\S+) :(\S+)/.test(ln))
		this.send(serv, "JOIN", RegExp.$5);
	else if (/^:(\S+)!(\S+)@(\S+) NICK :(\S+)/.test(ln))
	{	if (RegExp.$1 == this.nick) this.nick = RegExp.$4;
	} else if (/^:(\S+)(?:!(\S+)@(\S+)|) MODE (\S+)(?: (.+)|)/.test(ln))
	{	// XXX Parse!
	} else if (/^:(\S+)(?:!(\S+)@(\S+)|) KICK (\S+) (\S+) :(.*)/.test(ln))
		RegExp.$5 == this.nick && this.prefs.rejoinOnKick && this.send(serv, "JOIN", RegExp.$4);
	else if (/^:\S+ 433 \* ./.test(ln)) // Nick collision on connect.
	{	this.nick += "_";
		this.send(serv, "NICK", this.nick);
	}
}

calcbot.onMsg =
function onMsg(dest, msg, nick, host, at, serv)
{	/*** XXX Implement this fully. ***
	 * Don't try to kick/ban if:
	 *	a) we're not in a channel,
	 *	b) the message was from us
	 *	c) the user matches one of the nokick/superuser prefs
	 -	d) the user in question has any cmodes set
	 -	e) we don't have any cmodes set on us or
	 *	f) the message was sent by a relay bot.
	 */
	var fromUs = host == this.host || nick == this.nick,
		kb = at && !(fromUs || nick.match(this.prefs["nokick.nicks"]) || host.match(this.prefs["nokick.hosts"]) || host.match(this.prefs["superuser.hosts"]) /*|| this.cmodes[dest][nick] != []*/) /*&& this.cmodes[dest][this.nick] == []*/,
		meping = RegExp("^@?" + this.nick.replace(/[^\w\d]/g, "\\$&") + "([:,!.] ?| |$)", "i"),
		relay = false, equals = false, now = new Date().getTime(), s;
	// fix for buffer playback on ZNC, may produce false positives, dangerous
	if (this.prefs.fixZNCBuffer) msg = msg.replace(/^\[\d\d?:\d\d(:\d\d)?\] /, "");
	// fix for message relay bots
	if (this.prefs["relay.check"] && nick.match(this.prefs["relay.bots"]) && /^<.+> /.test(msg))
		msg = msg.replace(/^<(.+?)> /, ""), nick = RegExp.$1, at = nick + ": ",
		relay = true, kb = false, fromUs = nick == this.nick || fromUs;
	if ((/bot|Serv|Op$/i.test(nick) || /bot[\/.]/.test(host)) && !fromUs) return; // It's a bot (not us).
	if (now - this.lastTime > this.prefs["flood.seconds"] * 1000) this.lines = 0;
	if (this.lines >= this.prefs["flood.lines"] && now - this.lastTime <= this.prefs["flood.seconds"] * 1000)
	{	this.lastTime = now;
		if (this.flood)
		{	if (kb)
			{	this.prefs.flood.kick && this.send(serv, "KICK", dest, nick, ":No flooding!");
				this.prefs.flood.ban && this.send(serv, "MODE", dest, "+b *!*@" + host);
			}
		} else
		{	this.flood = true;
			writeln("[WARNING] Flood detected!");
			kb && this.prefs.flood.kick ? this.send(serv, "KICK", dest, nick, ":No flooding!") :
			this.prefs.flood.warn && !relay && this.send(serv, "NOTICE", nick, ":Please don't flood.");
		}
		this.prefs.flood.log && this.log(serv, "Flood", nick + (at ? " in " + dest : ""), msg);
		return;
	}
	this.flood = false;
	this.lastTime = now;
	this.lines++;
	msg = msg.replace(/\s+/g, " ").replace(/^ | $/g, "");
	try
	{	if (msg[0] == "\1") // Possible CTCP.
		{	if (/^\x01([^\1 ]+)(?: ([^\1]*)|)/.test(msg))
				this.onCTCP(RegExp.$1.toLowerCase(), RegExp.$2, nick, dest, serv);
		} else if (msg[0] == "=") // Starts with =.
		{	equals = true;
			if (host.match(this.prefs["superuser.hosts"]) && /^=rctrl (\S+)(?: (.+)|)/.test(msg))
				return this.remoteControl(RegExp.$1, RegExp.$2, dest, at, nick, serv);
			msg = msg.replace(/^[= ]+/, "").toLowerCase();
			if (/^['"^-]*[dpszo0?(){}\/|\\!<>.]*( |$)/.test(msg)) return; // Begins with a smiley.
			if (msg.match(this.abuse))
			{	if (!fromUs)
				{	if (kb)
					{	this.prefs.abuse.kick && this.send(serv, "KICK", dest, nick, ":Don't abuse me!");
						this.prefs.abuse.ban && this.send(serv, "MODE", dest, "+b *!*@" + host);
					} else !relay && this.prefs.abuse.warn && this.send(serv, "NOTICE", nick, ":Please don't try to abuse the calc bot.");
				}
				writeln("[WARNING] Abuse detected! ^^^^^");
				this.prefs.abuse.log && this.log(serv, "Abuse", nick + (at ? " in " + dest : ""), msg);
				return;
			}
			if (/^(\d*)d(\d+)$/.test(msg)) return this.send(serv, "PRIVMSG", dest, cmdDice(RegExp.$2, RegExp.$1));
			(s = this.parseMsg(msg)) != null && this.send(serv, "PRIVMSG", dest, ":" + at + s);
		} else if (meping.test(msg) || /^(what('| i)s |calc|math )/i.test(msg))
		{	msg = msg.replace(meping, "").toLowerCase();
			if (this.abuse.test(msg))
			{	this.prefs.abuse["log.ping"] && this.log(serv, "Ping", nick + (at ? " in " + dest : ""), msg);
				return;
			}
			if (/^(\d*)d(\d+)$/.test(msg)) return this.send(serv, "PRIVMSG", dest, cmdDice(RegExp.$2, RegExp.$1));
			(s = this.parseMsg(msg)) != null && ((typeof s == "number" && !isNaN(s)) ||
				s != "That isn't a real number." && s != "I don't do algebra. Sorry for any inconvienience."
			) && this.send(serv, "PRIVMSG", dest, ":" + at + s);
		} else if (!at) // PM!
		{	msg = msg.toLowerCase();
			if (this.abuse.test(msg))
			{	this.prefs.abuse["log.pm"] && this.log(serv, "PM", nick, msg);
				return;
			}
			if (/^(\d*)d(\d+)$/.test(msg)) return this.send(serv, "PRIVMSG", nick, cmdDice(RegExp.$2, RegExp.$1));
			(s = this.parseMsg(msg)) != null && ((typeof s == "number" && !isNaN(s)) ||
				s != "That isn't a real number." && s != "I don't do algebra. Sorry for any inconvienience."
			) && this.send(serv, "NOTICE", nick, ":" + s);
		} else if (dest == "#moocows")
		{	if (!/^au/.test(nick) && /hamburger|beef/i.test(msg))
				this.send(serv, "PRIVMSG", dest, ":\1ACTION eats", nick + "\1");
			else if (/moo|cow/i.test(msg))
			{	s =
				[	"Mooooooooooo!", "MOO!", "Moo.", "Moo. Moo.", "Moo Moo Moo, Moo Moo.",
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
				this.send(serv, "PRIVMSG", dest, ":" + s[ranint(0, s.length - 1)]);
			}
		} else if (/^help!?$/i.test(msg))
			this.send(serv, "PRIVMSG", dest, ":" + at +
							"Welcome! To get help, please state your problem. Being specific will get you help faster.");
	} catch(ex)
	{	if (equals) // Error, tell the user, but only if explicitly run.
		{	writeln("[ERROR] ", ex);
			this.prefs.error.log && this.log(serv, "ERROR", msg, nick + (at ? " in " + dest : ""), ex);
			this.prefs.error.apologise && this.send(serv, "PRIVMSG", dest, ":" + at + this.prefs.error.apologymsg);
			this.prefs.error.sendError && this.send(serv, "PRIVMSG", dest, ":" + at + ex);
		}
	}
}
calcbot.parseMsg =
function parseMsg(msg)
{	if (/ping/.test(msg)) return msg.replace("ping", "pong");
	if (/ha?ow('?s| (is|are|r|do)) (things|(|yo)u)|hr[yu]|(are|r) (|yo)u o*k/.test(msg))
			return "fine thanks! I've been up " + this.up() + " now!";
	if (/stat|up ?time/.test(msg)) return "I've been up " + this.up() + ".";
	if (/source|url/.test(msg)) return "Old cZ code: http://sites.google.com/site/davidvo2/calc.js | New JSDB code: http://ssh.shellium.org/~auscompgeek/calcbot.js";
	if (/\bver/.test(msg)) return !/what/.test(msg) ? this.version : undefined;
	if (/(is|a?re? (|yo)u) a bot/.test(msg)) return "Of course I'm a bot! Do you think a human can reply this fast?";
	if (/^(help|command|list)|^\?[^?]/.test(msg)) return calchelp(msg);
	if (msg.match(this.nick.replace(/[^\w\d]/g, "\\$&") + "|you|who a?re? u")) return "I'm a calc bot. /msg me help for a list of functions.";
	if (/bye|bai|bbl|brb/.test(msg)) return "Ok, hope I see you soon. :(";
	if (/bad ?bot/.test(msg)) return "Why am I a bad bot? :(";
	if (/botsnack|good ?bot/.test(msg)) return "Thanks! :)";
	if (this.prefs.easterEggs) // Time for some Easter Eggs! *dance*
	{	if (/lol|rofl/.test(msg)) return "Stop laughing!";
		if (/stfu|shut ?up|quiet/.test(msg)) return "Don't tell me to be quiet!";
		if (msg == "404" || /not|found/.test(msg)) return "404.not.found.shellium.org";
		if (/u'?re? dumb/.test(msg)) return "I'm dumb? Look who's talking!";
		if (/a\/?s\/?l/.test(msg)) return "In case you're wondering, I'm too young for you.";
		if (/aus?(co(mpgeek|w)|cg|blah)/.test(msg))
			   return "auscompgeek is the coolest Australian computer geek/nerd/whiz/expert around here!";
		if (/boo|ban|kick/.test(msg)) return "AHHHHH!!! NO!!!! Get it off! Get it off!";
		if (/destruct|explode|die|diaf/.test(msg)) return "10... 9... 8... 7... 6... 5... 4... 3... 2... 1... 0... *boom*";
		if (/^6 ?\* ?9$/.test(msg)) return "42... Jokes, 54 ;)"; // 'The Hitchhiker's Guide to the Galaxy'!
		if (/\/ ?0([^\d.!]|$)/.test(msg)) return "divide.by.zero.at.shellium.org";
		if (/danc(e|ing)/.test(msg)) return "free.dancing.bot.at.shellium.org! \\o/ |o| \\o\\ |o| /o/ |o| \\o/";
		if (/nul/.test(msg)) return "dev.null.route.shellium.org";
		if (/support/.test(msg)) return "support.team.at.shellium.org";
		if (/[bz]nc|egg/.test(msg)) return "free.psybnc.and.eggdrop.at.shellium.org";
		if (/kill/.test(msg)) return "kill.dash.nine.on.shellium.org";
		if (/rat/.test(msg)) return "rats.run.the.shell.on.shellium.org";
		if (/cookie/.test(msg)) return "free.cookies.at.shellium.org";
		if (/\b(|wo)m[ea]n/.test(msg)) return "all.the.women.are.men.at.shellium.org";
		if (/hamburger|beef/.test(msg)) return "Mmm, I shall eat you!";
		if (/moo|cow/.test(msg)) return "Moooooooooooooooooooo!";
	}
	if (msg == "" || /\bh(a?i|ello|ey)|bon(jou|soi)r|salut|yo|[sz]up|wb/.test(msg)) return "Hey man!";
	if (/self|shut|stfu|d(anc|ie|iaf|es)|str|our|(nu|lo|rof|ki)l|nc|egg|rat|cook|m[ea]n|kick|ban|[bm]o[ow]|ham|beef|a\/?s\/?l|au|not|found|up|quiet|bot/.test(msg)) return;
	if (/bot/.test(msg)) return this.parseRemark(msg);
	if (/[jkz]/.test(msg)) return "I don't do algebra. Sorry for any inconvienience.";
	if (/^([-+]?(\d+(?:\.\d+|)|\.\d+)) ?f$/.test(msg)) return f(RegExp.$1) + "C";
	if (/^([-+]?(\d+(?:\.\d+|)|\.\d+)) ?c$/.test(msg)) return c(RegExp.$1) + "F";
	// calculate & return result
	ans = calc(msg);
	if (this.prefs.userfriendly)
	{	if (isNaN(ans))
			return "That isn't a real number.";
		if (ans == Infinity)
			return "That's a number that's too large for me.";
		if (ans == -Infinity)
			return "That's a number that's too small for me.";
	}
	return ans;
}
calcbot.parseRemark =
function parseBotRemark(msg)
{	if (/good ?bot|botsnack/.test(msg)) return ":)";
	if (/bad ?bot/.test(msg)) return "Whyyyyy??? :(";
}
calcbot.up = // Code stolen from Ogmios :)
function uptime()
{	var diff = Math.round((this.lastTime - this.started) / 1000),
		s = diff % 60,
		m = (diff % 3600 - s) / 60,
		h = Math.floor(diff / 3600) % 24,
		d = Math.floor(diff / 3600 / 24);
	return (d ? d + "d " : "") + (h ? h + "h " : "") + (m ? m + "m " : "") + s + "s";
}
calcbot.onCTCP =
function onCTCP(type, msg, nick, dest, serv)
{	switch (type)
	{	case "action":
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
				"Hey! Stop it!", "Go away!",
				"Mooooooooooo!", "MOO!", "Moo.", "Moo. Moo.", "Moo Moo Moo, Moo Moo.",
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
				this.nick.replace(/[^\w\d]/g, "\\$&") + "\\b", "i") &&
				this.send(serv, "PRIVMSG", dest, ":" + res[ranint(0, res.length)]);
			break;
		case "version":
			this.nctcp(serv, nick, type, "aucg's JS IRC calc bot " + this.version +
					" (JSDB " + system.release + ", JS " + (system.version / 100));
			break;
		case "time":
			this.nctcp(serv, nick, type, new Date());
			break;
		case "source":
		case "url":
			this.nctcp(serv, nick, type, "http://ssh.shellium.org/~auscompgeek/calcbot.js on http://jsdb.org");
			break;
		case "ping":
			this.nctcp(serv, nick, type, msg);
			break;
		case "uptime":
		case "age":
			this.nctcp(serv, nick, type, this.up());
			break;
		case "prefix":
			this.nctcp(serv, nick, type, "=");
			break;
		case "gender":
		case "sex":
			this.nctcp(serv, nick, type, "bot");
			break;
		case "location":
			this.nctcp(serv, nick, type, "behind you");
			break;
		case "a/s/l":
		case "asl":
			this.nctcp(serv, nick, type, "2m/bot/behind you");
			break;
		case "avatar":
		case "icon":
		case "face":
			break;
		case "languages":
		case "language":
			this.nctcp(serv, nick, type, "JS,math,en");
			break;
		default:
			writeln("[ERROR] Unknown CTCP! ^^^^^");
			this.prefs.abuse["log.ctcp"] && this.log(serv, "CTCP", nick + (nick == dest ? "" : " in " + dest), type, msg);
	}
}
calcbot.remoteControl =
function rcBot(cmd, args, dest, at, nick, serv)
{	switch (cmd)
	{	case "self-destruct": // Hehe, I had to put this in :D
		case "explode":
			this.send(serv, "QUIT :" + at, "10... 9... 8... 7... 6... 5... 4... 3... 2... 1... 0... *boom*", args);
			break;
		case "die":
			this.send(serv, "QUIT :" + at + args);
			break;
		case "connect": // This might cause a memory leak. This is used to quit the bot & connect elsewhere.
			var argary = /^(?:irc:\/\/|)((?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-5])\.(?:\d\d?|1\d\d|2[0-4]\d|25[0-5])\.(?:\d\d?|1\d\d|2[0-4]\d|25[0-5])\.(?:\d\d?|1\d\d|2[0-4]\d|25[0-4])|[\w\d][\w\d.\-_]+\w)(?::([1-5]\d{0,4}|[6-9]\d{0,3}|6[0-5]{2}[0-3][0-5])|)(?:\/([^?]*)|)(?:\?pass=(.+)|)$/.exec(args);
			if (!argary) // Invalid URL?!?!?
			{	writeln("[ERROR] Invalid URL! ^^^^^");
				this.prefs.abuse.log && this.log(serv, "Invalid URL", nick + (at ? " in " + dest : ""), args);
				break;
			}
			argary.shift();
			this.send(serv, "QUIT :" + at + "Connecting to", argary[0] + (argary[1] ? ":" + argary[1] : "."));
			this.start(argary[0], argary[1], "", argary[3], argary[2]);
			break;
		case "join":
			if (/^[^#&+!]/.test(args)) args = "#" + args;
			this.send(serv, "JOIN", args);
			break;
		case "leave":
			var argary = args.split(" "),
				chan = argary.shift();
			if (/^[^#&+!]/.test(chan)) chan = "#" + chan;
			this.send(serv, "PART", chan, ":" + at + argary.join(" "));
			break;
		case "kick":
			var argary = args.split(" "),
				chan = argary.shift();
			if (argary[0] == this.nick)
			{	this.send(serv, "PRIVMSG", dest, ":" + at + "Get me to kick myself, yeah, great idea...");
				this.prefs.abuse.log && this.log(serv, "RC abuse", nick + (at ? " in " + dest : ""), "kick " + args);
				break;
			}
			if (/^[^#&+!]/.test(chan)) chan = "#" + chan;
			this.send(serv, "KICK", chan, argary.shift(), ":" + at + argary.join(" "));
			break;
		case "msg":
		case "privmsg":
		case "message":
			var argary = args.split(" ");
			if (argary[0] == this.nick)
			{	this.send(serv, "PRIVMSG", dest, ":" + at + "Get me to talk to myself, yeah, great idea...");
				this.prefs.abuse.log && this.log(serv, "RC abuse", nick + (at ? " in " + dest : ""), cmd + (args ? " " + args : ""));
				break;
			}
			this.send(serv, "PRIVMSG", argary.shift(), (argary.length > 1 || argary[0][0] == ":" ? ":" + argary.join(" ") : argary[0]));
			break;
		case "echo":
		case "say":
			this.send(serv, "PRIVMSG", dest, (/ |^:/.test(args) ? ":" + args : args));
			break;
		case "quote":
		case "raw":
			this.send(serv, args);
			break;
		case "eval":
		case "js": // Dangerous!
			if (/uneval ?\(.+\)/i.test(args) && /calcbot|this/i.test(args))
			{	writeln("[WARNING] Possible abuse! ^^^^^");
				this.prefs.abuse.log && this.log(serv, "RC abuse", nick + (at ? " in " + dest : ""), cmd + (args ? " " + args : ""));
				this.prefs.abuse.warn && this.send(serv, "NOTICE", nick, ":Please don't try to abuse my remote control.");
				break;
			}
			var res = eval(args);
			if (typeof res == "function") res = "function";
			res && this.send(serv, "PRIVMSG", dest, ":" + at + res);
			break;
		case "log":
			this.log(serv, "LOG", nick + (at ? " in " + dest : ""), args);
			break;
		case "reload":
			if (!run("calcbot.js"))
			{	this.send(serv, "PRIVMSG", dest, ":" + at + "I can't find myself!");
				this.log(serv, nick + (at ? " in " + dest : ""), "Can't reload calcbot!");
			}
			break;
		default:
			writeln("[ERROR] Possible abuse! ^^^^^");
			this.prefs.abuse.log && this.log(serv, "RC abuse", nick + (at ? " in " + dest : ""), cmd + (args ? " " + args : ""));
			this.prefs.abuse.warn && this.send(serv, "NOTICE", nick, ":Please don't try to abuse my remote control.");
	}
}

calcbot.send =
function send(serv)
{	var s = [];
	for (var i = 1; i < arguments.length; i++)
		s[i - 1] = arguments[i];
	if (s[0])
		//this.servs[serv].writeln(s.join(" ").replace(/\s+/, " ").replace(/^ | $/g, ""));
		this.serv.writeln(s.join(" ").replace(/\s+/, " ").replace(/^ | $/g, ""));
	else writeln("[ERROR] Call to send() without arguments?");
}
calcbot.nctcp = function nctcp(serv, nick, type, msg)
	this.send(serv, "NOTICE", nick, ":\1" + type.toUpperCase(), msg + "\1");
calcbot.log =
function log(serv)
{	if (!this.prefs.log) return;
	var s = [this.lastTime], log;
	for (var i = 1; i < arguments.length; i++)
		s[i] = arguments[i];
	if (s[1])
	{	log = new Stream("calcbot-" + serv + ".log", "a");
		log.writeln(s.join(": ").replace(/\s+/, " ").replace(/^ | $/g, ""));
		log.close();
	} else writeln("[ERROR] Call to log() without arguments?");
}

function calc(expr)
{	const pi = Math.PI, e = Math.E, // aliases
	// function aliases
		// trigonometric
		acos = Math.acos,
		asin = Math.asin,
		atan = Math.atan,
		atan2 = Math.atan2,
		cos = Math.cos,
		s = Math.sin,
		tan = Math.tan,
		// power & logarithmic
		exp = Math.exp,
		log = Math.log,
		pow = Math.pow,
		sqrt = Math.sqrt,
		// miscellaneous
		abs = Math.abs,
		ceil = Math.ceil,
		max = Math.max,
		min = Math.min,
		floor = Math.floor,
		round = Math.round,
		rnd = rand = Math.random,
			// give these aliases, even though we don't need to
			randomrange = randint = ranint,
			phi = (1 + sqrt(5)) / 2;
	expr = expr.replace(/(answer to |meaning of |)(|(|the )(|ultimate )question of )life,* the universe,* (and|&) every ?thing/g, "42")
	           .replace(/math\.*|#|\?+$|what('| i)s|calc(ulat(e|or)|)|imum|olute|ing|er|the|of/g, "").replace(/(a|)(?:rc|)(cos|sin|tan)\w+/g, "$1$2").replace(/(square ?|)root|\xE2\x88\x9A/g, "sqrt")
	           .replace(/ave\w+|mean/, "ave").replace(/(recip|fact|ra?nd|rand?int|d|\bs)[^q()]*?\b/, "$1").replace(/(\d+(?:\.\d+|!*)|\.\d+) ?([fc])/g, "$2($1)").replace(/(\d+|)d(\d+)/g, "d($2,$1)")
	           .replace(/(s|sqrt|round|floor|ceil|log|exp|recip) *(\d+(?:\.\d+|!*)|\.\d+)/g, "$1($2)").replace(/tan +(\d+(?:\.\d+|!*)|\.\d+)/, "tan($1)")
	           .replace(/(\d+(?:\.\d+(?:e[-+]?\d(?:\.\d+))|!*)|\.\d+|ph?i|e) ?\*\* ?([-+]?\d+(?:\.\d+(?:e[-+]?\d(?:\.\d+))|!*)|\.\d+|ph?i|e)/g, "pow($1,$2)").replace(/(\d+)!/g, "fact($1)")
	           .replace(/\b(\d+(?:\.\d+|)|\.\d+) ?([(a-df-wyz])/g,"$1*$2").replace(/\b(ph?i|e) ?([^-+*\/&|^<>%),?: ])/g,"$1*$2").replace(/(\(.+?\)) ?([^-+*\/&|^<>%!),?: ])/g,"$1*$2");
	while (/pow\(.+,.+\) ?\*\* ?[-+]?(\d+(\.\d|!?)|\.\d)/.test(expr) || /fact\(.+\)!/.test(expr)) // XXX "pow(pow(a,b),c) ** x" becomes "pow(pow(a,pow(b),c),x)"!
		expr = expr.replace(/pow(\(.+?,)(.+?)\) ?\*\* ?([-+]?(\d+(?:\.\d+|!*)|\.\d+))/g, "pow$1pow($2,$3))").replace(/(fact\(.+?\))!/g, "fact($1)");
	return Number(eval(expr));
}
function fact(n)
{	var e = 1;
	n = Number(n);
	if (n > 170)
		e = Infinity; // We can't calculate factorials past this, bail.
	else if (n < 0 || isNaN(n) || /\./.test(n))
		e = NaN; // Positive integers only.
	/*else if (n < 0) // Keeping this around for reference.
	{	for (var i = 1; i <= -n; i++)
			e *= i;
		e = -e;
	}*/
	else
		for (var i = 1; i <= n; i++)
			e *= i;
	return e;
}
function ave()
{	var total = 0;
	for (var i = 0; i < arguments.length; i++)
		total += arguments[i];
	return total / arguments.length;
}
function d(sides, count, modifier) // Partially from cZ dice plugin.
{	var total = 0, i;
	sides = parseInt(sides) || 6;
	count = parseInt(count) || 1;
	for (i = 0; i < count; i++)
		total += ranint(1, sides);
	return total + (parseFloat(modifier) || 0);
}
function ranint(min, max)
{	min = parseFloat(min) || 0;
	max = max || 1;
	if (min >= max) return NaN;
	return Math.floor(Math.random() * (max - min + 1)) + min;
}
function recip(n) 1 / n;

function f(temp) (temp - 32) / 1.8;
function c(temp) temp * 1.8 + 32;

function cmdDice(sides, count) // Partially from cZ dice plugin.
{	var ary = [], total = 0, i;
	sides = parseInt(sides) || 6;
	count = parseInt(count) || 1;
	for (i = 0; i < count; i++)
	{	ary[i] = ranint(1, sides);
		total += ary[i];
	}
	return calcbot.prefs.actDice ? ":\1ACTION rolls a d" + sides + (
		count > 1 ? " " + count + " times: " + ary.join(", ") + ", total: " + total : ": " + ary[0]
	) + "\1" : count > 1 ? ary.join("+") + "=" + total : ary[0];
}

function calchelp(e)
{	var s;
	e = e.replace(/help|commands*|[? #]|math\.*|imum|ing|er/g, "").substring(0, 7).replace(/s+$/, "");
	switch (e)
	{	case "arccosi": // arc cosine
		case "arcco": // Oops, where's our "s"?
		case "aco": // Oh my...
			s = "acos(x): Get the arc cosine of x in radians. See also: cos";
			break;
		case "arcsine":
		case "arcsin":
		case "asin":
			s = "asin(x): Get the arc sine of x in radians. See also: sin";
			break;
		case "arctang": // arc tangent
		case "arctan":
		case "atan":
			s = "atan(x): Get the arc tangent of x in radians. See also: atan2, tan";
			break;
		case "atan2":
			s = "atan2(y,x): Get atan(y/x) in radians. The result's between -pi & pi. " +
				"The vector in the plane from the origin to point (x,y) makes this angle " +
				"with the positive X axis. The point of atan2()'s that the signs of x & y are " +
				"known to it, so it can compute the correct quadrant for the angle. e.g. " +
				"atan(1) & atan2(1,1) = pi/4, but atan2(-1,-1) = -3*pi/4. See also: atan, tan";
			break;
		case "cosine":
		case "cosin":
		case "co": // Uh oh...
			s = "cos(x): Get the cosine of x radians. See also: acos";
			break;
		case "sine":
		case "sin":
			s = "s(x): Get the sine of x radians. See also: asin";
			break;
		case "tangent":
		case "tan":
			s = "tan(x): Get the tangent of x radians. See also: atan, atan2";
			break;
		case "exp":
			s = "exp(x): Get e**<x>. See also: pow.";
			break;
		case "logarit":
		case "log":
			s = "log(x): Get the logarithm of x to base e. See also: e";
			break;
		case "power":
		case "pow":
		case "**":
			s = "pow(x,y), x**y: Get x raised to the power of y. x**y**z = pow(x,pow(y,z)), " +
				"to respect order of operations. x and y can't be expressions with 'x**y', " +
				"but x can be in the format of pow(a,pow(b,c)). See also: exp, sqrt, e";
			break;
		case "^":
			s = "x^y: Bitwise XOR (exclusive OR), not exponentation! See also: **";
			break;
		case "squarer": // square root
		case "root":
		case "sqrt":
			s = "sqrt(x): Get the square root of x. See also: pow";
			break;
		case "absolut":
		case "ab": // Ouch!
			s = "abs(x): Get the absolute value of a number.";
			break;
		case "ceil":
			s = "ceil(x): Get the smallest integer >= x.";
			break;
		case "max":
			s = "max(x,y): Get the greater of x & y. See also: min";
			break;
		case "min":
			s = "min(x,y): Get the lesser of x & y. See also: max";
			break;
		case "floor":
			s = "floor(x): Get the integer part of a decimal. Commonly used with random. See also: rand, ranint, round";
			break;
		case "roundde": // round decimal
		case "round":
			s = "round(x): Round a decimal off to the nearest integer. See also: floor, rand, ranint";
			break;
		case "randomd": // random decimal
		case "random":
		case "rand":
		case "rnd":
			s = "rnd(): Get a random decimal e.g. floor(rnd()*(max-min+1))+min. See also: floor, round, ranint";
			break;
		case "randomi": // random integer
		case "randomr": // randomRange
		case "randint":
		case "ranint":
			s = "ranint([min,[max]]): Get a random integer between <min> & " +
				"<max>, default = 0 & 1. See also: dice, rand, floor, round";
			break;
		case "factori": // factorial
		case "fact":
		case "!":
			s = "fact(x), x!: Get the factorial of the positive integer x. There's an upper limit of 170 due to " +
				"technical problems. x can't be an expression with 'x!', but x can be in the format of fact(y).";
			break;
		case "recipro": // reciprocal
		case "recip":
			s = "recip(x), 1/x, pow(x,-1), x**-1: Get the reciprocal of x. See also: pow";
			break;
		case "average":
		case "mean":
		case "ave":
			s = "ave(x,y,...): Get the mean/average of {x,y,...} i.e. (x+y+...)/#ofScores";
			break;
		case "dice":
		case "d":
			s = "d([x,[y,[z]]]), [y]d<x>: Roll y dice with x number of sides, then add z. " +
				"NB: x & y can't be expressions with <y>d<x>! See also: ranint";
			break;
		case "f":
			s = "f(x), <x>f: Convert x degrees Fahrenheit to degrees Celsius. See also: c";
			break;
		case "c":
			s = "c(x), <x>c: Convert x degrees Celsius to degrees Fahrenheit. See also: f";
			break;
		case "e":
			s = "If e's used in the middle of a number, i.e. <x>e<y>, it's used to denote scientific notation" +
				" e.g. 2e100 = 2*10**100. NB: There's no spaces allowed in this case! " +
				"In other cases, e's the mathematical constant e. See also: exp, log, pow";
			break;
		case "pi":
			s = "pi: The mathematical constant pi, 4*atan 1, approximately 22/7 or 3.14.";
			break;
		case "phi":
			s = "phi: The mathematical constant phi, (1+sqrt 5)/2.";
			break;
		case "%":
			s = "x%y: Modulus, the remainder of division, not percentage.";
			break;
		case "decimal":
		case ".":
			s = "Decimal operations can be inaccurate. If you need better accuracy, use your computer's calculator!";
			break;
		case "list":
			s = calcbot.list;
			break;
		default:
			s = calcbot.help;
	}
	return calcbot.prefs.italicsInHelp ? s.replace(/</g, "\x1b[3m").replace(/>/g, "\x1b[23m") : s; // ANSI SGR italics!
}

calcbot.help || writeln("Don't forget to do calcbot.init() first!");