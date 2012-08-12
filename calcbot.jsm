// -*- Mode: JavaScript; tab-width: 4 -*- vim:tabstop=4 syntax=javascript:
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

if (!run("calc.js")) throw "Could not load calc functions from calc.js";

module.version = "2.3.3 (12 Aug 2012)";
module.prefs = {
	abuse: {
		log: true, // when triggered with =
		warn: true // warn user sending message
	},
	error: {
		log: true,
		sendError: true,
		apologise: false,
		apologymsg: "Sorry, I encountered an error while trying to evaluate your expression."
	},
	easterEggs: true, // toggle Easter eggs :-)
	userfriendly: false,
	actDice: false, // output <x>d<y> as /me rolls a d<y> x times: a, b, c, total: d
}
module.abuse = /load|java|ecma|op|doc|cli|(qui|exi|aler|prin|insul|impor)t|undef|raw|throw|win|nan|open|con|pro|patch|plug|play|infinity|my|for|(fals|minimi[sz]|dat|los|whil|writ|tru|typ)e|this|js|sys|scr|(de|loca|unti|rctr|eva)l|[\[{"}\]]|(?!what)'(?!s)/;
module.list = "Functions [<x>()]: acos, asin, atan, atan2, cos, sin, tan, exp, log, pow, sqrt, abs, ceil, max, min, floor, round, random, ranint, fact, mean, dice, f, c. Constants: e, pi, phi. Operators: %, ^, **. Other: decimal.";

module["cmd_="] = module.cmd_calc = module.cmd_math =
function cmd_calc(dest, msg, nick, ident, host, serv, relay) {
	var msg = msg.toLowerCase();
	if (msg.match(this.abuse)) {
		this.prefs.abuse.warn && !relay && aucgbot.send("NOTICE", nick, ":Whoa! Careful dude!");
		writeln("[WARNING] Abuse detected! ^^^^^");
		this.prefs.abuse.log && aucgbot.log(serv, "Calc abuse", nick + (dest != nick ? " in " + dest : ""), msg);
		return;
	}
	if (/^(\d*)d(\d+)$/.test(msg)) return aucgbot.send(serv, "PRIVMSG", dest, this.cmdDice(RegExp.$2, RegExp.$1));
	try { (s = this.parseMsg(msg)) != null && aucgbot.reply(serv, dest, nick, s); }
	catch (ex) {
		writeln("[ERROR] ", ex);
		this.prefs.error.log && aucgbot.log(serv, "CALC ERROR", msg, nick + (dest != nick ? " in " + dest : ""), ex);
		this.prefs.error.apologise && aucgbot.reply(serv, dest, nick, this.prefs.error.apologymsg);
		this.prefs.error.sendError && aucgbot.reply(serv, dest, nick, ex);
	}
}
module.cmd_base =
function cmd_base(dest, msg, nick, ident, host, serv, relay) {
	var args = msg.split(" ");
	if (args.length < 2 || args.length > 3)
		aucgbot.reply(serv, dest, nick, "Invalid usage. Usage: base <num> <fromBase> [<toBase>]");
	else
		aucgbot.reply(serv, dest, nick, parseInt(args[0], args[1]).toString(parseInt(args[2]) || 10));
	return true;
}
module.cmd_qe =
function cmd_quadraticEquation(dest, msg, nick, ident, host, serv, relay) {
	var a, b, c, _2a, pron, rhs, resInSqrt, resSqrt, res = [];
	const helpMsg = "qe: Evaluates the value of the pronumeral in a quadratic equation in general form i.e. ax**2 + bx + c = 0";
	if (!/^(?:([+-]?\d*) ?\*? ?)?(\w) ?(?:\*\*|\^) ?2 ?(?:([+-] ?\d*) ?\*? ?\2)? ?([+-] ?\d+)? ?= ?([+-]?\d+)$/.test(msg)) {
		// not a quadratic equation, bail
		aucgbot.reply(serv, dest, nick, helpMsg);
		return true;
	}
	pron = RegExp.$2, a = RegExp.$1, b = RegExp.$3, c = RegExp.$4, rhs = parseFloat(RegExp.$5);
	a = a ? parseFloat(a) : 1; _2a = 2 * a;
	b = b ? parseFloat(b.replace(/\s+/, "")) : 1;
	c = (c ? parseFloat(c.replace(/\s+/, "")) : 0) - rhs;
	resInSqrt = b * b - 4 * a * c; // inside our sqrt sign
	if (resInSqrt < 0) {
		// answer is a complex number, bail
		// XXX simplify surd
		aucgbot.reply(serv, dest, nick, pron + " = (" + (-b) + encodeUTF8(" \u00B1 \u221A") + resInSqrt + ") / " + _2a);
		return true;
	}
	res.push("(" + (-b) + encodeUTF8(" \u00B1 \u221A") + resInSqrt + ") / " + _2a);
	resSqrt = Math.sqrt(resInSqrt);
	res.push((-b + resSqrt) / _2a);
	res.push((-b - resSqrt) / _2a);
	aucgbot.reply(serv, dest, nick, pron + " = " + res.join(" or "));
	return true;
}

module.parseMsg =
function parseMsg(msg) {
	if (/help|list|^\?[^?]/.test(msg)) return this.help(msg);
	if (this.prefs.easterEggs) { // Time for some Easter Eggs! *dance*
		if (/^6 ?\* ?9$/.test(msg)) return "42... Jokes, 54 ;)"; // 'The Hitchhiker's Guide to the Galaxy' (trilogy of 6)!
		if (msg == "9001") return "IT'S OVER 9000!!!1";
		/* SHellium is dead
		if (/\/ ?0([^\d.!]|$)/.test(msg)) return "divide.by.zero.at.shellium.org";
		if (msg == "404" || /not|found/.test(msg)) return "404.not.found.shellium.org";*/
		if (/pie/.test(msg)) return "Mmmm, pie... 3.1415926535898...";
	}
	if (/self|shut|stfu|d(anc|ie|iaf|es)|str|our|(nu|lo|rof|ki)l|nc|egg|rat|cook|m[ea]n|kick|ban|[bm]o[ow]|ham|beef|a\/?s\/?l|au|not|found|up|quiet|bot|pie/.test(msg)) return;
	if (/[jkz]|\b\d*i\b/.test(msg)) return "I don't support algebra. Sorry for any inconvienience.";
	if (/^([-+]?(\d+(?:\.\d+|)|\.\d+))[\u00b0 ]?f$/.test(msg)) return f(RegExp.$1) + "C";
	if (/^([-+]?(\d+(?:\.\d+|)|\.\d+))[\u00b0 ]?c$/.test(msg)) return c(RegExp.$1) + "F";
	// calculate & return result
	ans = calc(msg);
	if (this.prefs.userfriendly) {
		if (isNaN(ans))
			return "That isn't a real number.";
		if (ans == Infinity)
			return this.prefs.easterEggs ? "IT'S OVER 9000!!!1" : "That's a number that's too large for me.";
		if (ans == -Infinity)
			return "That's a number that's too small for me.";
	}
	return msg + ": " + ans;
}
module.cmdDice =
function cmdDice(sides, count) { // Partially from cZ dice plugin.
	var ary = [], total = 0, i;
	sides = parseInt(sides) || 6;
	count = parseInt(count) || 1;
	if (sides > 100) sides = 100;
	for (i = 0; i < count; i++) {
		ary[i] = ranint(1, sides);
		total += ary[i];
	}
	return this.prefs.actDice ? ":\1ACTION rolls a d" + sides + (
		count > 1 ? " " + count + " times: " + ary.join(", ") + ", total: " + total : ": " + ary[0]
	) + "\1" : count > 1 ? ary.join("+") + "=" + total : ary[0];
}

module.help =
function calcHelp(e) {
	var s;
	switch (e.replace(/help|[? #]|math\.*|imum|ing|er/g, "").substring(0, 7).replace(/s+$/, "")) {
	case "arccosi": // arc cosine
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
		s = "cos(x): Get the cosine of x radians. See also: acos, sin";
		break;
	case "sine":
	case "sin":
	case "s":
		s = "s(x): Get the sine of x radians. See also: asin, cos";
		break;
	case "tangent":
	case "tan":
		s = "tan(x): Get the tangent of x radians, sin(x)/cos(x). See also: atan, atan2";
		break;
	case "exp":
		s = "exp(x): Get e**x. See also: e, pow.";
		break;
	case "logarit":
	case "log":
	case "ln":
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
		s = "abs(x): Get the absolute value of x, i.e. sqrt(x*x)";
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
		s = "floor(x): Get the integer part of a decimal. Commonly used for random numbers. See also: rand, ranint, round";
		break;
	case "roundde": // round decimal
	case "round":
		s = "round(x,[prec]): Round a number off to the nearest <prec>. See also: floor, rand, ranint";
		break;
	case "randomd": // random decimal
	case "random":
	case "rand":
	case "rnd":
		s = "rnd(): Get a random decimal e.g. floor(rnd()*(max-min+1))+min. TODO: Automatically add () when omitted. See also: floor, round, ranint";
		break;
	case "randomi": // random integer
	case "randomr": // ChatZilla calls it randomRange
	case "getrand": // getRandomInt example on MDN (https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Math/random#Example:_Using_Math.random)
	case "randint":
	case "ranint":
		s = "ranint([min,[max]]): Get a random integer between min & max, default = 1 & 10. See also: dice, rand, floor, round";
		break;
	case "factori": // factorial
	case "fact":
	case "!":
		s = "fact(x), x!: Get the factorial of the positive integer x. There's an upper limit of 170 due to " +
			"technical restrictions. x can't be an expression with 'x!', but x can be in the format of fact(y).";
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
		s = "e: If used in the middle of a number, i.e. <x>e<y>, used to denote scientific notation" +
			" e.g. 2e100 = 2*10**100. NB: No spaces allowed in this case! " +
			"Euler's constant in other cases. See also: exp, log, pow";
		break;
	case "pi":
		s = "pi: The mathematical constant pi, 4*atan 1, 180 degrees, approximately 22/7 or 3.14.";
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
	case "trig":
		s = "Note that the trigonometric functions (sin, cos, tan, asin, acos, atan, atan2) expect or return angles in radians - to convert radians to degrees divide by (pi / 180), and multiply by this to convert the other way.";
		break;
	case "list":
		s = this.list;
		break;
	default:
		s = "This is aucg's JS calc bot v" + this.version + ". Usage: = " +
			"<expr>. " + this.list + " Type = ?<topic> for more information.";
	}
	return s;
}