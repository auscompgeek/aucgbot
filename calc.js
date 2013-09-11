// -*- Mode: JavaScript; tab-width: 4 -*- vim:tabstop=4:
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
/*jshint esnext: true, evil: true, expr: true, proto: true, regexdash: true, smarttabs: true, withstmt: true, indent: 1, white: false */
/*global randint: false */

calc_mem = {};
calc_mem.__proto__ = Math;
function calc(expr) {
	"ans,atan,atan2,tan,ceil,max,min,randint".split(",").forEach(function(i) delete calc_mem[i]);
	const pi = Math.PI, e = Math.E, sqrt = Math.sqrt, phi = (1 + sqrt(5)) / 2, c = 299792458,
		sin = Math.sin, cos = Math.cos, asin = Math.asin, acos = Math.acos, floor = Math.floor,
		pow = Math.pow, abs = Math.abs, exp = Math.exp, ln = Math.log, log = ln, rnd = Math.random, rand = rnd;
	expr = expr.replace(/(?:answer to |meaning of |)(?:(?:the |)(?:ultimate |)question of |)life,* the universe,* (?:and|&) every ?thing/g, "42").replace("speed of light", "c")
	           .replace(/math\w*|\?+$|calc(?:ulat(?:e|or)|)|imum|olute|ing|er|the|of/g, "").replace(/(a|)(?:r(?:c|ea|)|)(cos|sin|tan|csc|sec|cot)\w+?(h|)/g, "$1$2$3").replace("#", "0x", "g")
	           .replace(/(?:square ?|)root|\u221A/g, "sqrt").replace("\u03C0", "pi", "g").replace("\u03C6", "phi", "g").replace("\u00B9"/*<sup>1</sup>*/, "", "g").replace("\u00B2", "**2", "g").replace("\u00B3", "**3", "g")
	           .replace("\u00D7"/*sign*/, "*", "g").replace("\u00FA"/*dot*/, "*", "g").replace("\u00F7"/*sign*/, "/", "g").replace("\u2215"/*slash*/, "/", "g").replace("\u2044"/*fraction*/, "/", "g").replace("\u2260", "!=", "g").replace("\u2264", "<=", "g").replace("\u2265", ">=", "g")
	           .replace(/(recip|fact|randint|ra?nd|dice|sqrt|(?:co|)sec|(?:sin|cos|csc|cot|tan)h?)[^ ()]*\b/g, "$1").replace(/(\d*)d(\d+)/g, "dice($2,$1)")
	           .replace(/ra?nd ?(?!\()/, "rnd()").replace(/ave\w+|mean/, "ave").replace(/(sqrt|(?:sin|cos|tan|csc|sec|cot)h?|atan2|round|floor|ceil|log|exp|recip) (\d+(?:\.\d+|!*)|\.\d+)/g, "$1($2)")
	           .replace(/(\d+(?:\.\d+(?:e[+-]?\d(?:\.\d+))|!*)|\.\d+|ph?i|e) ?\*\* ?([+-]?\d+(?:\.\d+(?:e[+-]?\d(?:\.\d+))|!*)|\.\d+|ph?i|e)/g, "pow($1,$2)").replace(/(\d+)!/g, "fact($1)")
	           .replace(/\b(\d+(?:\.\d+|)|\.\d+) ?([(a-df-wyz])/g, "$1*$2").replace(/\b(ph?i|e|c) ?([^+*\/&|\^<>%),?: -])/g, "$1*$2").replace(/(\(.*?\)) ?([^+*\/&|\^<>%!),?: -])/g, "$1*$2");
	while (/pow\(.+,.+\) ?\*\* ?[+-]?(\d+(\.\d|!?)|\.\d)/.test(expr) || /\w*\(.+\)!/.test(expr)) // FIXME "pow(pow(a,b),c) ** x" becomes "pow(pow(a,pow(b),c),x)"!
		expr = expr.replace(/pow(\(.+?,)(.+?)\) ?\*\* ?([+-]?(\d+(?:\.\d+|!*)|\.\d+))/g, "pow$1pow($2,$3))").replace(/(\w*\(.+?\))!/g, "fact($1)");
	var vars = expr.match(/\b[a-z_]\w*(?= ?=[^=])/g);
	if (vars)
		vars.forEach(function(i) calc_mem[i] = undefined);
	"pi,e,tan,log,exp,sqrt,cosh,sinh,tanh,acosh,asinh,atanh".split(",").forEach(function(i) delete calc_mem[i]);
	"fact,ave,d,round,recip,cbrt,root,sign,radians,degrees,sec,csc,cot,asec,acsc,coth,sech,csch,acoth,asech,acsch".split(",").forEach(function(i) delete calc_mem[i]);
	with (calc_mem)
		Math.ans = +eval(expr);
	return expr;

	function fact(x) {
		var e = 1;
		x = +x;
		if (x > 170) // We can't calculate factorials past this, we get Infinity.
			e = Infinity;
		else if (x < 0 || isNaN(x) || x != floor(x))
			e = NaN; // Positive integers only.
		else
			while (x > 1)
				e *= x--;
		return e;
	}
	function ave() {
		var sum = 0;
		for (var i = arguments.length - 1; i >= 0; i--)
			sum += arguments[i];
		return sum / arguments.length;
	}
	function dice(sides, count, modifier) { // Partially from cZ dice plugin.
		var sum = +modifier || 0;
		sides = parseInt(sides) || 6;
		count = parseInt(count) || 1;
		if (count > 1000)
			sum += randint(count, sides * count);
		else
			for (var i = 0; i < count; i++)
				sum += randint(1, sides);
		return sum;
	}

// Start lambdas. JSHint doesn't like lambdas, please ignore errors below this line.
	function round(x, prec) prec ? Math.round(x / prec) * prec : Math.round(x);
	function recip(x) 1 / x;
	function cbrt(x) pow(x, 1 / 3);
	function root(z, x) pow(z, 1 / x);
	function sign(x) x < 0 ? -1 : x == 0 ? x : x > 0 ? 1 : NaN;
	function degrees(z) z * 180 / pi;
	function radians(z) z * pi / 180;

	// trigonometry
	function sec(z) 1 / cos(z);
	function csc(z) 1 / sin(z);
	function cot(z) cos(z) / sin(z);
	function asec(z) acos(1 / z);
	function acsc(z) asin(1 / z);
	function cosh(z) (exp(z) + exp(-z)) / 2;
	function sinh(z) (exp(z) - exp(-z)) / 2;
	function tanh(z) sinh(z) / cosh(z);
	function coth(z) cosh(z) / sinh(z);
	function sech(z) 1 / cosh(z);
	function csch(z) 1 / sinh(z);
	function acosh(z) log(z + sqrt(z * z - 1));
	function asinh(z) log(z + sqrt(z * z + 1));
	function atanh(z) 1 / 2 * log((1 + z) / (1 - z));
	function asech(z) 1 / acosh(z);
	function acsch(z) 1 / asinh(z);
	function acoth(z) 1 / 2 * log((1 + z) / (z - 1));
}
function ftoc(temp) (temp - 32) / 1.8;
function ctof(temp) temp * 1.8 + 32;
