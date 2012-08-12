/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

var ans;

function calc(expr) {
	const pi = Math.PI, e = Math.E, phi = (1 + Math.sqrt(5)) / 2, //c = 299798...
		// trigonometric
		acos = Math.acos,
		asin = Math.asin,
		atan = Math.atan,
		atan2 = Math.atan2,
		cos = Math.cos,
		s = Math.sin,
		tan = Math.tan,
		// power/logarithmic
		log = ln = Math.log,
		exp = Math.exp,
		pow = Math.pow,
		sqrt = Math.sqrt,
		// miscellaneous
		abs = Math.abs,
		ceil = Math.ceil,
		max = Math.max,
		min = Math.min,
		floor = Math.floor,
		rnd = rand = Math.random,
		randomrange = randint = ranint;
	expr = expr.replace(/(answer to |meaning of |)(|(|the )(|ultimate )question of )life,* the universe,* (and|&) every ?thing/g, "42")
	           .replace(/math\.*|#|\?+$|what('| i)s|calc(ulat(e|or)|)|imum|olute|ing|er|the|of/g, "").replace(/(a|)(?:rc|rea|)(cos|sin|tan)\w+?(h|)/g, "$1$2$3")
	           .replace(/(square ?|)root|\u221A/g, "sqrt").replace("\u03C0", "pi").replace("\u03C6", "phi").replace("\u00B9"/*<sup>1</sup>*/, "").replace("\u00B2", "**2").replace("\u00B3", "**3")
	           .replace("\u00D7", "*").replace("\u00F7"/*sign*/, "/").replace("\u2215"/*slash*/, "/").replace("\u2044"/*fraction*/, "/").replace("\u2260", "!=").replace("\u2264", "<=").replace("\u2265", ">=")
	           .replace(/(recip|fact|rand?int|ra?nd|d|sqrt|(?:co|)sec|(?:csc|cot|tan)h?|s|h)[^ ()]*\b/, "$1").replace(/(\d+(?:\.\d+|!*)|\.\d+)[\u00b0 ]?([cf])/g, "$2($1)").replace(/(\d+|)d(\d+)/g, "d($2,$1)")
	           .replace(/ave\w+|mean/, "ave").replace(/(sqrt|s|round|floor|ceil|log|exp|recip) *(\d+(?:\.\d+|!*)|\.\d+)/g, "$1($2)").replace(/tan +(\d+(?:\.\d+|!*)|\.\d+)/, "tan($1)")
	           .replace(/(\d+(?:\.\d+(?:e[-+]?\d(?:\.\d+))|!*)|\.\d+|ph?i|e) ?\*\* ?([-+]?\d+(?:\.\d+(?:e[-+]?\d(?:\.\d+))|!*)|\.\d+|ph?i|e)/g, "pow($1,$2)").replace(/(\d+)!/g, "fact($1)")
	           .replace(/\b(\d+(?:\.\d+|)|\.\d+) ?([(a-df-wyz])/g,"$1*$2").replace(/\b(ph?i|e) ?([^-+*\/&|^<>%),?: ])/g,"$1*$2").replace(/(\(.+?\)) ?([^-+*\/&|^<>%!),?: ])/g,"$1*$2");
	while (/pow\(.+,.+\) ?\*\* ?[-+]?(\d+(\.\d|!?)|\.\d)/.test(expr) || /fact\(.+\)!/.test(expr)) // XXX "pow(pow(a,b),c) ** x" becomes "pow(pow(a,pow(b),c),x)"!
		expr = expr.replace(/pow(\(.+?,)(.+?)\) ?\*\* ?([-+]?(\d+(?:\.\d+|!*)|\.\d+))/g, "pow$1pow($2,$3))").replace(/(fact\(.+?\))!/g, "fact($1)");
	return Number(eval(expr));
}
function fact(x) {
	var e = 1;
	x = Number(x);
	if (x > 170) // We can't calculate factorials past this, we get Infinity.
		e = Infinity;
	else if (x < 0 || isNaN(x) || x != Math.floor(x))
		e = NaN; // Positive integers only.
	else
		for (var i = x; i > 1; i--)
			e *= i;
	return e;
}
function ave() {
	var total = 0;
	for (var i = 0; i < arguments.length; i++)
		total += arguments[i];
	return total / arguments.length;
}
function d(sides, count, modifier) { // Partially from cZ dice plugin.
	var total = 0, i;
	sides = parseInt(sides) || 6;
	count = parseInt(count) || 1;
	if (sides > 100) sides = 100;
	for (i = 0; i < count; i++)
		total += ranint(1, sides);
	return total + (parseFloat(modifier) || 0);
}
function round(x, prec) prec ? Math.round(x / prec) * prec : Math.round(x);
function f(temp) (temp - 32) / 1.8;
function c(temp) temp * 1.8 + 32;
function recip(x) 1 / x;
function cbrt(x) Math.pow(x, 1/3);
function root(z, x) Math.pow(z, 1/x);
function sign(x) Math.abs(x) / x; // or x / Math.abs(x)

// trigonometry
function sec(x) 1 / Math.cos(x);
function csc(x) 1 / Math.sin(x);
function cot(x) Math.cos(x) / Math.sin(x);
function asec(x) Math.acos(1 / x);
function acsc(x) Math.asin(1 / x);
function cosh(x) (Math.exp(x) + Math.exp(-x))/2;
function sinh(x) (Math.exp(x) - Math.exp(-x))/2;
function tanh(x) sinh(x) / cosh(x);
function coth(x) cosh(x) / sinh(x);
function sech(x) 1 / cosh(x);
function csch(x) 1 / sinh(x);
function acosh(x) Math.log(x + Math.sqrt(x*x-1));
function asinh(x) Math.log(x + Math.sqrt(x*x+1));
function atanh(x) 1/2 * Math.log((1+x) / (1-x));
function asech(x) 1 / acosh(x);
function acsch(x) 1 / asinh(x);
function acoth(x) 1/2 * Math.log((1+x) / (x-1));
