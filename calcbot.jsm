// -*- Mode: JavaScript; tab-width: 4 -*- vim:tabstop=4 syntax=javascript:
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var math = require("mathjs");

module.exports.version = "4.0.5 (2016-07-15)";
module.exports.prefs = {
	equalPrefix: true, // treat messages starting with = as a calculator expression
	abuse: {
		log: true,
		warn: true
	},
	error: {
		log: true,
		sendError: true,
		apologise: false,
		apologymsg: "Sorry, I encountered an error while trying to evaluate your expression."
	},
	easterEggs: true, // toggle Easter eggs :-)
	userfriendly: false,
	actDice: true // output <x>d<y> as /me rolls a d<y> x times: a, b, c; total: d
};
module.exports.calcs = {};

module.exports.onNick = function onNick(e) {
	const calcs = this.calcs, oldNick = e.oldNick.split("|")[0], oldNickCalc = calcs[oldNick], newNick = e.newNick.split("|")[0];
	if (oldNickCalc && !calcs[newNick]) {
		calcs[newNick] = oldNickCalc;
	}
};

module.exports.onUnknownMsg = function onUnknownMsg(e) {
	// Note: This silently ignores errors to avoid weird stuff.
	var msg = e.msg;
	if (msg[0] !== "=" || !this.prefs.equalPrefix) {
		return false;
	}
	msg = msg.slice(1).replace(/(?:\/\/|@).*/, "").trim();
	if (msg.length < 3 || /^[\-^]?(.)\1+$/.test(msg)) {
		// eh, not interested
		return false;
	}
	var dest = e.dest, nick = e.nick, name = nick.split("|")[0];
	var calc = this.calcs[name];
	if (!calc) {
		calc = this.calcs[name] = {};
	}
	try {
		var s;
		if (/^(\d*)d(\d+)$/.test(msg)) {
			e.send(this.cmdDice(RegExp.$2, RegExp.$1));
		} else if ((s = this.parseMsg(msg, calc))) {
			e.reply(s);
		}
	} catch (ex) {
		console.error(ex);
		if (this.prefs.error.log) {
			e.log("CALC ERROR", nick + (dest !== nick ? " in " + dest : ""), msg, ex);
		}
	}
	return true;
};

module.exports["cmd_="] = module.exports.cmd_calc = module.exports.cmd_math = function cmd_calc(e) {
	var dest = e.dest, msg = e.args.replace(/(?:\/\/|@).*/, ""), nick = e.nick, name = nick.split("|")[0];
	if (!msg) {
		e.reply(cmd_calc.help);
		return true;
	}
	var calc = this.calcs[name];
	if (!calc) {
		calc = this.calcs[name] = {};
	}
	try {
		var s;
		if (/^(\d*)d(\d+)$/.test(msg)) {
			e.send(this.cmdDice(RegExp.$2, RegExp.$1));
		} else if ((s = this.parseMsg(msg, calc))) {
			e.reply(s);
		}
	} catch (ex) {
		console.error(ex);
		if (this.prefs.error.log) {
			e.log("CALC ERROR", nick + (dest !== nick ? " in " + dest : ""), msg, ex);
		}
		if (this.prefs.error.apologise) {
			e.reply(this.prefs.error.apologymsg);
		}
		if (this.prefs.error.sendError) {
			e.reply(ex);
		}
	}
	return true;
};
module.exports.cmd_calc.help = "A powerful calculator. Whatever you do probably works. (Excel-style prefixed messages to the channel also work unless disabled.)";

module.exports.cmd_base = function cmd_base(e) {
	var args = e.args.split(" ");
	if (args.length < 2 || args.length > 3) {
		e.reply(this.cmd_base.help);
	} else {
		e.reply(parseInt(args[0], args[1]).toString(parseInt(args[2]) || 10));
	}
	return true;
};
module.exports.cmd_base.help = "Convert a number from one base to another. Usage: base <num> <fromBase> [<toBase>]";

module.exports.cmd_base10 = function cmd_base10(e) {
	var args = e.args.split(" ");
	if (args.length !== 2) {
		e.reply(this.cmd_base10.help);
	} else {
		e.reply((+args[0]).toString(+args[1]));
	}
	return true;
};
module.exports.cmd_base10.help = "Convert a decimal number to another base. Usage: base10 <num> <toBase>";

module.exports.cmd_qe = function cmd_quadraticEqn(e) {
	var match = e.args.match(/^(?:([-+]?\d*(?:\.\d*)?) ?\*? ?)?(\w) ?(?:\*\*|\^) ?2 ?(([-+] ?\d*(?:\.\d*)?) ?\*? ?\2)? ?([-+] ?\d*(?:\.\d*)?)? ?= ?([-+]?\d*(?:\.\d*)?)$/);
	if (!match) {
		// not a quadratic equation, bail
		e.reply(this.cmd_qe.help);
		return true;
	}
	var pron = match[2], a = (match[1] || "").trim(), bx = match[3], b = (match[4] || "").trim(), c = match[5];
	var _2a, delta, sqrtDelta;
	if ("+-".includes(a)) {
		a += "1";
	}
	if ("+-".includes(b)) {
		b += "1";
	}
	a = a ? +a : 1, _2a = 2*a;
	b = bx ? b ? +b.replace(/\s+/, "") : 1 : 0;
	c = (c ? +c.replace(/\s+/, "") : 0) - match[6];
	delta = b*b - 4*a*c;
	if (delta < 0) {
		// answer is complex, bail
		e.reply(pron, "= ({0} \xB1 \u221A{1})/{2} = {3} \xB1 {4}i".format(-b, delta, _2a, -b/_2a, Math.sqrt(-delta)/_2a));
		return true;
	}
	if (delta === 0) {
		e.reply(pron, "= {0}/{1} = {2}".format(-b, _2a, -b/_2a));
		return true;
	}
	sqrtDelta = Math.sqrt(delta);
	e.reply(pron, "= ({0} \xB1 \u221A{1})/{2} = {3} or {4}".format(-b, delta, _2a, (-b + sqrtDelta)/_2a, (-b - sqrtDelta)/_2a));
	return true;
};
module.exports.cmd_qe.help = "Evaluates the value of the pronumeral in a quadratic equation in general form, i.e. ax**2 + bx + c = 0. Usage: qe <equation>";

module.exports.cmd_dice = module.exports.cmd_roll = function cmd_roll(e) {
	var args = e.args;
	if (/^(\d*)d(\d+)$/.test(args)) {
		e.send(this.cmdDice(RegExp.$2, RegExp.$1));
	} else {
		e.send(this.cmdDice.apply(this, args.split(" ")));
	}
	return true;
};
module.exports.cmd_roll.help = "Roll some dice. Usage: roll [<num>]d<sides> OR roll [<sides> [<num>]]";

module.exports.parseMsg = function parseMsg(msg, calc) {
	if (this.prefs.easterEggs) { // Time for some Easter Eggs! *dance*
		if (/^6 ?\* ?9$/.test(msg)) // 'The Hitchhiker's Guide to the Galaxy' (trilogy of 6)!
			return "42. Wait, what?";
		if (/^2 ?\+ ?2$/.test(msg)) // 1984
			return "2 + 2 = 5";
		if (msg == "9001")
			return "IT'S OVER 9000!!!1";
		if (msg == "404")
			return "HTTP/1.1 404 Not Found";
		if (msg == "418")
			return "418 I'm a teapot";
		if (/\/ ?0([^\d.!]|$)/.test(msg))
			return "division by zero";
		if (/pie/.test(msg))
			return "Mmmm, pie... 3.141592653589793...";
	}
	// calculate & return result
	var node = math.parse(msg);
	var ans = node.compile().eval(calc);
	if (this.prefs.userfriendly) {
		if (ans == Infinity) {
			return this.prefs.easterEggs ? "IT'S OVER 9000!!!1" : "That's a number that's too big for me.";
		}
		if (ans == -Infinity) {
			return "That's a number that's too negative for me.";
		}
	}
	if (typeof ans === "function") {
		ans = ans.toString();
		ans = ans.slice(0, ans.indexOf("{")-1);
	}
	return node + ": " + ans;
};

// Very loosely based on the cZ dice plugin.
module.exports.cmdDice = function cmdDice(sides, count) {
	var ary = [], total = 0, i;
	sides = parseInt(sides) || 6;
	count = parseInt(count) || 1;
	if (count < 0)
		count = -count;
	if (count > 25 || (sides > 25 && count > 1)) {
		i = sides * count;
		if (!isFinite(i)) {
			return this.prefs.actDice ? "\x01ACTION tried to roll too many dice\x01" : "Too many/large dice to roll.";
		}
		total = randint(count, i);
		return this.prefs.actDice ? "\x01ACTION rolls some dice, totalling " + total + ".\x01" : total;
	}
	for (i = 0; i < count; i++) {
		total += ary[i] = randint(1, sides);
	}
	if (this.prefs.easterEggs && isNaN(total)) {
		total = "Batman!";
	}
	if (this.prefs.actDice) {
		return "\x01ACTION rolls a d{0}{1}: {2}\x01".format(sides, count > 1 ? " " + count + " times: " + ary.join(", ") + "; total" : "", total);
	}
	return count > 1 ? ary.join(" + ") + " = " + total : ary[0];
};
