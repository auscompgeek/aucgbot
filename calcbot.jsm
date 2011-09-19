/* -*- Mode: JavaScript; tab-width: 4 -*- vim:tabstop=4 syntax=javascript:
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
 * The Original Code is aucg's JS IRC bot.
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
 */

module.version = "2.0 (28 Aug 2011)";
module.prefs =
{	abuse:
	{	log: true, // when triggered with =
		warn: true // warn user sending message
	},
	error:
	{	log: true,
		sendError: true,
		apologise: false,
		apologymsg: "Sorry, I encountered an error while trying to evaluate your expression."
	},
	easterEggs: true, // toggle Easter eggs :-)
	userfriendly: false,
	actDice: false, // output <x>d<y> as /me rolls a d<y> x times: a, b, c, total: d
}
module.abuse = /load|java|ecma|op|doc|cli|(qui|exi|aler|prin|insul|impor)t|undef|raw|throw|window|nan|open|con|pro|patch|plug|play|infinity|my|for|(fals|minimi[sz]|dat|los|whil|writ|tru|typ)e|this|js|sys|scr|(de|loca|unti|rctr|eva)l|[\["\]]|(?!what)'(?!s)/;
module.list = "Functions [<x>()]: acos, asin, atan, atan2, cos, sin, tan, exp, log, pow, sqrt, abs, ceil, max, min, floor, round, random, ranint, fact, mean, dice, f, c. Constants: e, pi, phi. Operators: %, ^, **. Other: decimal.";

module["cmd_="] = module.cmd_calc = module.cmd_math =
function cmd_calc(dest, msg, nick, host, at, serv, relay)
{	var msg = msg.toLowerCase();
	if (msg.match(this.abuse))
	{	this.prefs.abuse.warn && !relay && !fromUs && aucgbot.send("NOTICE", nick, ":Whoa! Careful dude!");
		writeln("[WARNING] Abuse detected! ^^^^^");
		this.prefs.abuse.log && aucgbot.log(serv, "Abuse", nick + (at ? " in " + dest : ""), msg);
		return;
	}
	if (/^(\d*)d(\d+)$/.test(msg)) return aucgbot.send("PRIVMSG", dest, this.cmdDice(RegExp.$2, RegExp.$1));
	try { (s = this.parseMsg(msg)) != null && aucgbot.send("PRIVMSG", dest, ":" + at + s) }
	catch (ex) {
		writeln("[ERROR] ", ex);
		this.prefs.error.log && aucgbot.log(serv, "ERROR", msg, nick + (at ? " in " + dest : ""), ex);
		this.prefs.error.apologise && aucgbot.send("PRIVMSG", dest, ":" + at + this.prefs.error.apologymsg);
		this.prefs.error.sendError && aucgbot.send("PRIVMSG", dest, ":" + at + ex);
	}
}

module.parseMsg =
function parseMsg(msg)
{	if (/help|list|^\?[^?]/.test(msg)) return this.help(msg);
	if (this.prefs.easterEggs) // Time for some Easter Eggs! *dance*
	{	if (/^6 ?\* ?9$/.test(msg)) return "42... Jokes, 54 ;)"; // 'The Hitchhiker's Guide to the Galaxy'!
		if (msg == "9001") return "Over 9000! :O";
		if (/\/ ?0([^\d.!]|$)/.test(msg)) return "divide.by.zero.at.shellium.org";
		if (msg == "404" || /not|found/.test(msg)) return "404.not.found.shellium.org";
		if (/pie/.test(msg)) return "Mmmm, pie... 3.1415926535859...";
	}
	if (/self|shut|stfu|d(anc|ie|iaf|es)|str|our|(nu|lo|rof|ki)l|nc|egg|rat|cook|m[ea]n|kick|ban|[bm]o[ow]|ham|beef|a\/?s\/?l|au|not|found|up|quiet|bot|pie/.test(msg)) return;
	if (/[jkz]/.test(msg)) return "I don't support algebra. Sorry for any inconvienience.";
	if (/\b\d*i\b/.test(msg)) return "I don't support complex numbers. Sorry for any inconvienience.";
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
	           .replace(/ave\w+|mean/, "ave").replace(/(recip|fact|rand?int|ra?nd|d|sqrt|s)[^ ()]*\b/, "$1").replace(/(\d+(?:\.\d+|!*)|\.\d+) ?([fc])/g, "$2($1)").replace(/(\d+|)d(\d+)/g, "d($2,$1)")
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
	if (n > 170) // We can't calculate factorials past this, bail.
		e = Infinity;
	else if (n < 0 || isNaN(n) || /\./.test(n))
		e = NaN; // Positive integers only.
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
	if (sides > 100) sides = 100;
	for (i = 0; i < count; i++)
		total += ranint(1, sides);
	return total + (parseFloat(modifier) || 0);
}
module.cmdDice =
function cmdDice(sides, count) // Partially from cZ dice plugin.
{	var ary = [], total = 0, i;
	sides = parseInt(sides) || 6;
	count = parseInt(count) || 1;
	if (sides > 100) sides = 100;
	for (i = 0; i < count; i++)
	{	ary[i] = ranint(1, sides);
		total += ary[i];
	}
	return this.prefs.actDice ? ":\1ACTION rolls a d" + sides + (
		count > 1 ? " " + count + " times: " + ary.join(", ") + ", total: " + total : ": " + ary[0]
	) + "\1" : count > 1 ? ary.join("+") + "=" + total : ary[0];
}
function recip(n) 1 / n;
function f(temp) (temp - 32) / 1.8;
function c(temp) temp * 1.8 + 32;

module.help =
function help(e)
{	var s;
	e = e.replace(/help|[? #]|math\.*|imum|ing|er/g, "").substring(0, 7).replace(/s+$/, "");
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
		case "s":
			s = "s(x): Get the sine of x radians. See also: asin";
			break;
		case "tangent":
		case "tan":
			s = "tan(x): Get the tangent of x radians. See also: atan, atan2";
			break;
		case "exp":
			s = "exp(x): Get e**x. See also: pow.";
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
			s = "abs(x): Get the absolute value of x. (I have absolutely no idea what this is.)";
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
			s = "rnd(): Get a random decimal e.g. floor(rnd()*(max-min+1))+min. TODO: Automatically add () when omitted. See also: floor, round, ranint";
			break;
		case "randomi": // random integer
		case "randomr": // randomRange
		case "randint":
		case "ranint":
			s = "ranint([min,[max]]): Get a random integer between min & max, default = 0 & 1. See also: dice, rand, floor, round";
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
			s = this.list;
			break;
		default:
			s = "This is aucg's JS calc bot v" + this.version + ". Usage: = " +
				"<expr>. " + this.list + " Type = ?<topic> for more information.";
	}
	return s;
}