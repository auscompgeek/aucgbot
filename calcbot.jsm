// -*- Mode: JavaScript; tab-width: 4 -*- vim:tabstop=4 syntax=javascript:
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
/*global aucgbot: false, ctof: false, calc: false, ftoc: false, module.exports: false, randint: false, run: false */

//require("./es5-sham.js");
var math = require("mathjs");

module.exports.version = "4.0.4 (2015-11-05)";
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
//module.exports.abuse = /[\[{'"}\]]|alert|ass|cli|con|date|def|del|doc|ecma|eval|exit|false|for|glob|import|in[fs]|java|js|lo(?:ad|cal|se)|minimi|my|nan|op|p(?:ro|atch|lug|lay|rint)|quit|raw|rctrl|read|rite|run|scr|sys|this|throw|true|until|voice|while|win|yp/;
//module.exports.list = "Functions: acos, asin, atan, atan2, cos, sin, tan, exp, ln, pow, sqrt, abs, ceil, max, min, floor, round, random, randint, fact, mean, dice, ftoc, ctof. Constants: e, pi, phi, c. Operators: %, ^, **. Other topics: decimal, trig.";
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
	/*
	if (msg.match(this.abuse)) {
		console.warn("[WARNING] Abuse detected! ^^^^^");
		if (this.prefs.abuse.log) {
			e.log("CALC ABUSE", nick + (dest !== nick ? " in " + dest : ""), msg);
		}
		return true;
	}
	*/
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
	/*
	if (msg.match(this.abuse)) {
		if (this.prefs.abuse.warn && !e.relay) {
			e.notice("Whoa! Careful dude!");
		}
		console.warn("[WARNING] Abuse detected! ^^^^^");
		if (this.prefs.abuse.log) {
			e.log("CALC ABUSE", nick + (dest !== nick ? " in " + dest : ""), msg);
		}
		return true;
	}
	*/
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
}
module.exports.cmd_base10.help = "Convert a decimal number to another base. Usage: base10 <num> <toBase>";

module.exports.cmd_qe = function cmd_quadraticEqn(e) {
	var args = e.args;
	if (!/^(?:([+\-]?\d*(?:\.\d*)?) ?\*? ?)?([A-Za-z]) ?(?:\*\*|\^) ?2 ?(?:([+\-] ?\d*(?:\.\d*)?) ?\*? ?\2)? ?([+\-] ?\d*(?:\.\d*)?)? ?= ?([+\-]?\d*(?:\.\d*)?)$/.test(args)) {
		// not a quadratic equation, bail
		e.reply(this.cmd_qe.help);
		return true;
	}
	var pron = RegExp.$2, a = RegExp.$1.trim(), b = RegExp.$3.trim(), c = RegExp.$4, _2a, delta, sqrtDelta;
	if ("+-".includes(a)) {
		a += "1";
	}
	if ("+-".includes(b)) {
		b += "1";
	}
	a = a ? +a : 1, _2a = 2*a;
	b = b ? +b.replace(/\s+/, "") : 1;
	c = (c ? +c.replace(/\s+/, "") : 0) - RegExp.$5;
	delta = b*b - 4*a*c;
	if (delta < 0) {
		// answer is complex, bail
		// TODO simplify surd
		e.reply(pron, "= ({0} \xB1 \u221A{1})/{2}".format(-b, delta, _2a));
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
/*
	if (/help|list|^\?[^?]/.test(msg)) {
		return this.help(msg);
	}
*/
	if (this.prefs.easterEggs) { // Time for some Easter Eggs! *dance*
		if (/^6 ?\* ?9$/.test(msg)) // 'The Hitchhiker's Guide to the Galaxy' (trilogy of 6)!
			return "42. Wait, what?";
		if (/^2 ?\+ ?2$/.test(msg)) // 1984
			return "2 + 2 = 5";
		if (msg == "9001")
			return "IT'S OVER 9000!!!1";
		if (msg == "404")
			return "HTTP/1.1 404 Not Found";
		if (/\/ ?0([^\d.!]|$)/.test(msg))
			return "division by zero";
		if (/pie/.test(msg))
			return "Mmmm, pie... 3.141592653589793...";
	}
	/*if (/self|shut|stfu|d(anc|ie|iaf|es)|str|our|(nu|lo|rof|ki)l|nc|egg|rat|cook|m[ea]n|kick|ban|[bm]o[ow]|ham|beef|a\/?s\/?l|au|not|found|up|quiet|bot|pie/.test(msg)) {
		return;
	}*/
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
	if (count > 25 || sides > 25) {
		i = sides * count;
		if (!isFinite(i)) {
			return "\x01ACTION tried to roll too many dice\x01";
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

/*
module.exports.help = function calcHelp(e) {
	switch (e.replace(/help|[? #]|math\.*|imum|ing|er/g, "").slice(0, 7)) {
	case "arccosi": case "arccos": case "acos": case "cos^-1": case "cos^(-1":
		return "acos(z): Get the arc cosine of z in radians. See also: cos";
	case "arcsine": case "arcsin": case "asin": case "sin^-1": case "sin^(-1":
		return "asin(z): Get the arc sine of z in radians. See also: sin";
	case "arctang": case "arctan": case "atan": case "tan^-1": case "tan^(-1":
		return "atan(z): Get the arc tangent of z in radians. See also: atan2, tan";
	case "atan2":
		return "atan2(y,x): Get atan(y/x). -pi < atan2(y,x) < pi. " +
			"The vector in the plane from (0,0) to (x,y) makes the angle " +
			"with the +x axis. This is so the signs of (x,y) are known " +
			"so the correct quadrant for the angle can be computed. e.g. " +
			"atan(1) = atan2(1,1) = pi/4, but atan2(-1,-1) = -3pi/4. See also: atan, tan";
	case "sine": case "sin":
		return "sin(z): Get the sine of z radians, opp/hyp. See also: asin, cos, tan";
	case "cosine": case "cosin": case "cos":
		return "cos(z): Get the cosine of z radians, adj/hyp. See also: acos, sin, tan";
	case "tangent": case "tan":
		return "tan(z): Get the tangent of z radians, opp/adj, sin(z)/cos(z). See also: atan, atan2, sin, cos";
	case "exp":
		return "exp(x): Get e**x. See also: e, pow, ln.";
	case "logarit": case "log": case "loge": case "ln":
		return "ln(x): Get the logarithm of x to base e. See also: e";
	case "power": case "pow": case "**":
		return "pow(x,y), x**y: Get x raised to the power of y. x**y**z = pow(x,pow(y,z)) " +
			"to respect order of operations. x and y can't be expressions with x**y, " +
			"but x can be in the format of pow(a,pow(b,c)). See also: exp, sqrt, e";
	case "^":
		return "x^y: Bitwise XOR (exclusive OR), not exponentiation! See also: **";
	case "squarer": // square root
	case "sqroot": case "sqrt":
		return "sqrt(x): Get the square root of x. See also: pow, root";
	case "root":
		return "root(z,x): Get the xth root of z. See also: pow, sqrt";
	case "absolut": case "abs":
		return "abs(x): Get the absolute value of x, i.e. sqrt(x*x)";
	case "ceil":
		return "ceil(x): Get the smallest integer >= x. See also: floor, round";
	case "max":
		return "max(x,y): Get the greater of x & y. See also: min";
	case "min":
		return "min(x,y): Get the lesser of x & y. See also: max";
	case "floor":
		return "floor(x): Round a number down, i.e. towards -Infinity. See also: ceil, round";
	case "roundde": // round decimal
	case "round":
		return "round(x,[p]): Round a number to a given precision in decimal digits (default 0 digits). See also: floor, ceil";
	case "randomd": // random decimal
	case "random": case "rand": case "rnd":
		return "rand(): Get a random decimal e.g. floor(rand()*(max-min+1))+min. See also: dice, floor, randint";
	case "randomi": // random integer
	case "randomr": // randomRange (ChatZilla)
	case "randint": // like Python's random module
		return "randint([min,[max]]): Get a random integer between min & max, default = 1 & 10. See also: dice, rand, floor, round";
	case "factori": case "fact": case "!":
		return "fact(x), x!: Get the factorial of the positive integer x, where x < 170 due to technical " +
			"restrictions. x can't be an expression with 'x!', but x can be in the format of fact(y).";
	case "recipro": case "recip":
		return "recip(x), 1/x, pow(x,-1), x**-1: Get the reciprocal of x. See also: pow";
	case "average": case "mean": case "ave": case "avg":
		return "ave(x,y,...): Get the mean/average of {x,y,...} i.e. (x+y+...)/#scores";
	case "dice": case "d":
		return "d([x,[y,[z]]]), [y]d<x>: Roll y dice with x number of sides, then add z. " +
			"NB: x & y can't be expressions with <y>d<x>! See also: randint";
	case "ftoc":
		return "ftoc(x): Convert x degrees Fahrenheit to degrees Celsius. See also: c";
	case "ctof":
		return "ctof(x): Convert x degrees Celsius to degrees Fahrenheit. See also: f";
	case "e":
		return "e: If used in the middle of a number, i.e. <x>e<y>, " +
			"used to denote scientific notation e.g. 2e100 = 2*10**100. " +
			"Euler's number in other cases. See also: exp, log, pow";
	case "pi":
		return "pi: The mathematical constant pi, 4*atan 1, the ratio of a circle's circumference to its diameter, 180 degrees, ~ 22/7 or 3.14.";
	case "phi":
		return "phi: The mathematical constant phi, (1+sqrt 5)/2, the golden ratio.";
	case "c":
		return "c: The speed of light, ~ 3e8.";
	case "mod": case "%":
		return "x%y: Modulus, the remainder of division, not percentage.";
	case "decimal": case ".":
		return "Decimal operations can be inaccurate. If you need better accuracy, use an actual calculator or Wolfram|Alpha!";
	case "trig":
		return "Note that the trigonometric functions expect/return angles in radians. " +
			"To convert radians to degrees multiply by 180/pi and vice versa. " +
			"The functions degrees and radians are provided for your use.";
	case "list":
		return this.list;
	default:
		return "This is aucg's JS calc bot v" + this.version + ". Usage: = <expr>. " +
			this.list + " Type = ?<topic> for more information.";
	}
};
*/
