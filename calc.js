// -*- Mode: JavaScript; tab-width: 4 -*- vim:tabstop=4:
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
/*jshint esnext: true, evil: true, expr: true, regexdash: true, smarttabs: true */

function calc(expr) {
	const ans = Math.ans, pi = Math.PI, e = Math.E, phi = (1 + Math.sqrt(5)) / 2, //c = 299792458,
		// trigonometric
		acos = Math.acos,
		asin = Math.asin,
		atan = Math.atan,
		atan2 = Math.atan2,
		cos = Math.cos,
		s = Math.sin,
		tan = Math.tan,
		// power/logarithmic
		ln = Math.log, log = ln,
		exp = Math.exp,
		pow = Math.pow,
		sqrt = Math.sqrt,
		// miscellaneous
		abs = Math.abs,
		ceil = Math.ceil,
		max = Math.max,
		min = Math.min,
		floor = Math.floor,
		rnd = Math.random, rand = rnd,
		randomrange = randint;
	expr = expr.replace(/(answer to |meaning of |)(|(the |)(ultimate |)question of )life,* the universe,* (and|&) every ?thing/g, "42").replace("speed of light", "299792458")
	           .replace(/math\.*|[#,]|\?+$|what('| i)s|calc(ulat(e|or)|)|imum|olute|ing|er|the|of/g, "").replace(/(a|)(?:rc|rea|)(cos|sin|tan)\w+?(h|)/g, "$1$2$3")
	           .replace(/(square ?|)root|\u221A/g, "sqrt").replace("\u03C0", "pi").replace("\u03C6", "phi").replace("\u00B9"/*<sup>1</sup>*/, "").replace("\u00B2", "**2").replace("\u00B3", "**3")
	           .replace("\u00D7", "*").replace("\u00F7"/*sign*/, "/").replace("\u2215"/*slash*/, "/").replace("\u2044"/*fraction*/, "/").replace("\u2260", "!=").replace("\u2264", "<=").replace("\u2265", ">=")
	           .replace(/(recip|fact|randint|ra?nd|d|sqrt|(?:co|)sec|(?:csc|cot|tan)h?|s|h)[^ ()]*\b/, "$1").replace(/(\d+(?:\.\d+|!*)|\.\d+)[\xB0 ]?([cf])/g, "$2($1)").replace(/(\d+|)d(\d+)/g, "d($2,$1)")
	           .replace(/ra?nd ?(?!\()/, "rnd()").replace(/ave\w+|mean/, "ave").replace(/(sqrt|s|(?:sin|cos|tan|csc|cot)h?|atan2|round|floor|ceil|log|exp|recip) (\d+(?:\.\d+|!*)|\.\d+)/g, "$1($2)")
	           .replace(/(\d+(?:\.\d+(?:e[+-]?\d(?:\.\d+))|!*)|\.\d+|ph?i|e) ?\*\* ?([+-]?\d+(?:\.\d+(?:e[+-]?\d(?:\.\d+))|!*)|\.\d+|ph?i|e)/g, "pow($1,$2)").replace(/(\d+)!/g, "fact($1)")
	           .replace(/\b(\d+(?:\.\d+|)|\.\d+) ?([(a-df-wyz])/g, "$1*$2").replace(/\b(ph?i|e) ?([^+*\/&|\^<>%),?: -])/g, "$1*$2").replace(/(\(.*?\)) ?([^+*\/&|\^<>%!),?: -])/g, "$1*$2");
	while (/pow\(.+,.+\) ?\*\* ?[+-]?(\d+(\.\d|!?)|\.\d)/.test(expr) || /fact\(.+\)!/.test(expr)) // FIXME "pow(pow(a,b),c) ** x" becomes "pow(pow(a,pow(b),c),x)"!
		expr = expr.replace(/pow(\(.+?,)(.+?)\) ?\*\* ?([+-]?(\d+(?:\.\d+|!*)|\.\d+))/g, "pow$1pow($2,$3))").replace(/(fact\(.+?\))!/g, "fact($1)");
	return Math.ans = +eval(expr);

	function fact(x) {
		var e = 1;
		x = +x;
		if (x > 170) // We can't calculate factorials past this, we get Infinity.
			e = Infinity;
		else if (x < 0 || isNaN(x) || x != floor(x))
			e = NaN; // Positive integers only.
		else
			for (; x > 1; x--)
				e *= x;
		return e;
	}
	function ave() {
		var sum = 0;
		for (var i = arguments.length - 1; i >= 0; i--)
			sum += arguments[i];
		return sum / arguments.length;
	}
	function d(sides, count, modifier) { // Partially from cZ dice plugin.
		var sum = +modifier || 0;
		sides = parseInt(sides) || 6;
		count = parseInt(count) || 1;
		if (count > 100)
			count = 100;
		for (var i = 0; i < count; i++)
			sum += randint(1, sides);
		return sum;
	}

// Start lambdas. JSHint doesn't like lambdas, please ignore errors below this line.
	function round(x, prec) prec ? Math.round(x / prec) * prec : Math.round(x);
	function recip(x) 1 / x;
	function cbrt(x) pow(x, 1 / 3);
	function root(z, x) pow(z, 1 / x);
	function sign(x) abs(x) / x; // or x / abs(x)
	function radtodeg(z) z * 180 / pi;
	function degtorad(z) z * pi / 180;

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
function f(temp) (temp - 32) / 1.8;
function c(temp) temp * 1.8 + 32;
