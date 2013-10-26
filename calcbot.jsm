// -*- Mode: JavaScript; tab-width: 4 -*- vim:tabstop=4 syntax=javascript:
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
/*global aucgbot: false, ctof: false, calc: false, encodeUTF8: false, ftoc: false, module: false, randint: false, run: false, writeln: false */

if (!run("calc.js"))
	throw new Error("Could not load calc functions from calc.js");

module.version = "2.10 (2013-10-26)";
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
	actDice: true // output <x>d<y> as /me rolls a d<y> x times: a, b, c; total: d
};
module.abuse = /load|run|java|ecma|op|doc|cli|(?:qui|exi|aler|prin|insul|impor|scrip)t|def|raw|throw|win|nan|open|con|p(?:ro|atch|lug|lay)|inf|my|for|(?:fals|minimi[sz]|dat|los|whil|writ|tru|typ)e|read|this|js|sys|scr|(?:de|loca|unti|rctr|eva)l|glob|[\[{'"}\]]/;
module.list = "Functions [<x>()]: acos, asin, atan, atan2, cos, sin, tan, exp, ln, pow, sqrt, abs, ceil, max, min, floor, round, random, randint, fact, mean, dice, ftoc, ctof. Constants: e, pi, phi, c. Operators: %, ^, **. Other topics: decimal, trig.";

module["cmd_="] = module.cmd_calc = module.cmd_math = function cmd_calc(e) {
	var dest = e.dest, msg = e.args.replace(/(?:\/\/|@).*/, "").toLowerCase(), nick = e.nick, conn = e.conn;
	if (msg.match(this.abuse)) {
		if (this.prefs.abuse.warn && !relay)
			conn.send("NOTICE", nick, ":Whoa! Careful dude!");
		writeln("[WARNING] Abuse detected! ^^^^^");
		if (this.prefs.abuse.log)
			aucgbot.log(conn, "CALC ABUSE", nick + (dest != nick ? " in " + dest : ""), msg);
		return true;
	}
	try {
		var s;
		if (/^(\d*)d(\d+)$/.test(msg))
			conn.msg(dest, this.cmdDice(RegExp.$2, RegExp.$1));
		else if ((s = this.parseMsg(msg)))
			conn.reply(dest, nick, s);
	} catch (ex) {
		writeln("[ERROR] ", ex);
		if (this.prefs.error.log)
			aucgbot.log(conn, "CALC ERROR", nick + (dest != nick ? " in " + dest : ""), msg, ex);
		if (this.prefs.error.apologise)
			conn.reply(dest, nick, this.prefs.error.apologymsg);
		if (this.prefs.error.sendError)
			conn.reply(dest, nick, ex);
	}
	return true;
};
module.cmd_base = function cmd_base(e) {
	var dest = e.dest, args = e.args.split(" "), nick = e.nick, conn = e.conn;
	if (args.length < 2 || args.length > 3)
		conn.reply(dest, nick, "Invalid usage. Usage: base <num> <fromBase> [<toBase>]");
	else
		conn.reply(dest, nick, parseInt(args[0], args[1]).toString(parseInt(args[2]) || 10));
	return true;
};
module.cmd_base10 = function cmd_base10(e) {
	var dest = e.dest, args = e.args.split(" "), nick = e.nick, conn = e.conn;
	if (args.length != 2)
		conn.reply(dest, nick, this.cmd_base10.help);
	else
		conn.reply(dest, nick, (+args[0]).toString(+args[1]));
	return true;
}
module.cmd_base10.help = "Convert a decimal number to another base. Usage: base10 <num> <toBase>";
module.cmd_qe = function cmd_quadraticEqn(e) {
	var dest = e.dest, args = e.args, nick = e.nick, conn = e.conn;
	if (!/^(?:([+\-]?\d*(?:\.\d*)?) ?\*? ?)?([A-Za-z]) ?(?:\*\*|\^) ?2 ?(?:([+\-] ?\d*(?:\.\d*)?) ?\*? ?\2)? ?([+\-] ?\d*(?:\.\d*)?)? ?= ?([+\-]?\d*(?:\.\d*)?)$/.test(args)) {
		// not a quadratic equation, bail
		conn.reply(dest, nick, this.cmd_qe.help);
		return true;
	}
	var pron = RegExp.$2, a = RegExp.$1, b = RegExp.$3, c = RegExp.$4, _2a, resInSqrt, resSqrt, res = [];
	if ("+-".contains(a))
		a += "1";
	if ("+-".contains(b))
		b += "1";
	a = a ? +a : 1, _2a = 2 * a;
	b = b ? +b.replace(/\s+/, "") : 1;
	c = (c ? +c.replace(/\s+/, "") : 0) - RegExp.$5;
	resInSqrt = b * b - 4 * a * c; // inside our sqrt sign
	if (resInSqrt < 0) {
		// answer is a complex number, bail
		// TODO simplify surd
		conn.reply(dest, nick, pron + " = (" + (-b) + " \u00B1 \u221A" + resInSqrt + ") / " + _2a);
		return true;
	}
	res.push("(" + (-b) + " \u00B1 \u221A" + resInSqrt + ") / " + _2a);
	resSqrt = Math.sqrt(resInSqrt);
	res.push((-b + resSqrt) / _2a);
	res.push((-b - resSqrt) / _2a);
	conn.reply(dest, nick, pron + " = " + res.join(" or "));
	return true;
};
module.cmd_qe.help = "qe: Evaluates the value of the pronumeral in a quadratic equation in general form i.e. ax**2 + bx + c = 0";
module.cmd_dice = module.cmd_roll = function cmd_roll(e) {
	var dest = e.dest, conn = e.conn, args = e.args;
	if (/^(\d*)d(\d+)$/.test(args))
		conn.msg(dest, this.cmdDice(RegExp.$2, RegExp.$1));
	else
		conn.msg(dest, this.cmdDice.apply(this, args.split(" ")));
	return true;
};

module.parseMsg = function parseMsg(msg) {
	if (/help|list|^\?[^?]/.test(msg))
		return this.help(msg);
	if (this.prefs.easterEggs) { // Time for some Easter Eggs! *dance*
		if (/^6 ?\* ?9$/.test(msg)) // 'The Hitchhiker's Guide to the Galaxy' (trilogy of 6)!
			return "42. Wait, what?";
		if (msg == "9001")
			return "IT'S OVER 9000!!!1";
		if (msg == "404")
			return "HTTP/1.1 404 Not Found";
		if (/\/ ?0([^\d.!]|$)/.test(msg))
			return "division by zero";
		if (/pie/.test(msg))
			return "Mmmm, pie... 3.141592653589793...";
	}
	if (/self|shut|stfu|d(anc|ie|iaf|es)|str|our|(nu|lo|rof|ki)l|nc|egg|rat|cook|m[ea]n|kick|ban|[bm]o[ow]|ham|beef|a\/?s\/?l|au|not|found|up|quiet|bot|pie/.test(msg))
		return;
	if (/[jkz]|\b\d*i\b/.test(msg))
		return "I don't support algebra. Sorry for any inconvenience.";
	if (/^([+\-]?(\d+(?:\.\d+|)|\.\d+))[\u00b0 ]?f$/.test(msg))
		return ftoc(RegExp.$1) + "C";
	if (/^([+\-]?(\d+(?:\.\d+|)|\.\d+))[\u00b0 ]?c$/.test(msg))
		return ctof(RegExp.$1) + "F";
	// calculate & return result
	msg = calc(msg);
	if (this.prefs.userfriendly) {
		if (isNaN(Math.ans))
			return "That isn't a real number.";
		if (Math.ans == Infinity)
			return this.prefs.easterEggs ? "IT'S OVER 9000!!!1" : "That's a number that's too big for me.";
		if (Math.ans == -Infinity)
			return "That's a number that's too negative for me.";
	}
	return msg + ": " + Math.ans.toLocaleString();
};
// Very loosely based on the cZ dice plugin.
module.cmdDice = function cmdDice(sides, count) {
	var ary = [], total = 0;
	sides = parseInt(sides) || 6;
	count = parseInt(count) || 1;
	if (count < 0)
		count = -count;
	if (count > 25 || sides > 25) {
		i = sides * count;
		if (!isFinite(i))
			return "\x01ACTION tried to roll too many dice\x01";
		total = randint(count, i);
		return this.prefs.actDice ? "\x01ACTION rolls some dice, totalling " + total + ".\x01" : total;
	}
	for (var i = 0; i < count; i++)
		total += ary[i] = randint(1, sides);
	if (this.prefs.easterEggs && isNaN(total))
		total = "Batman!"
	if (this.prefs.actDice)
		return "\x01ACTION rolls a d" + sides + (count > 1 ? " " + count + " times: " + ary.join(", ") + "; total: " : ": ") + total + "\x01";
	return count > 1 ? ary.join(" + ") + " = " + total : ary[0];
};

module.help = function calcHelp(e) {
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
			"with the + X axis. This is so the signs of x & y are known " +
			"so the correct quadrant for the angle can be computed. e.g. " +
			"atan(1) = atan2(1,1) = pi/4, but atan2(-1,-1) = -3*pi/4. See also: atan, tan";
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
		return "ceil(x): Get the smallest integer >= x.";
	case "max":
		return "max(x,y): Get the greater of x & y. See also: min";
	case "min":
		return "min(x,y): Get the lesser of x & y. See also: max";
	case "floor":
		return "floor(x): Round a number down, i.e. towards -Infinity. See also: round";
	case "roundde": // round decimal
	case "round":
		return "round(x,[prec]): Round a number off to the nearest prec, default 1. See also: floor";
	case "randomd": // random decimal
	case "random": case "rand": case "rnd":
		return "rand(): Get a random decimal e.g. floor(rand()*(max-min+1))+min. See also: dice, floor, randint";
	case "randomi": // random integer
	case "randomr": // randomRange (ChatZilla)
	case "getrand": // getRandomInt https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Math/random#Example:_Using_Math.random
	case "randint": // like Python's random module
		return "randint([min,[max]]): Get a random integer between min & max, default = 1 & 10. See also: dice, rand, floor, round";
	case "factori": case "fact": case "!":
		return "fact(x), x!: Get the factorial of the positive integer x where x < 170 due to technical " +
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
