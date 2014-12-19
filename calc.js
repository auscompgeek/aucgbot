// -*- Mode: JavaScript; tab-width: 4 -*- vim:tabstop=4:
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
/*jshint esnext: true, evil: true, expr: true, proto: true, smarttabs: true, withstmt: true, indent: 1, white: false */
/*global randint: false */
// Notice: JSHint doesn't like function lambdas; please ignore any errors that may relate to these.
"use strict";
/** @constructor */
function Calculator() {
	this.vars = {
		__proto__: Calculator.funcs,
		ans: undefined,             // last answer
		_: undefined,
		e: Math.E,                  // Euler's number
		N: 6.022e+23,               // Avogadro's number
		c: 299792458,               // speed of light in m/s
		tau: 2 * Math.PI,
		phi: (1 + Math.sqrt(5)) / 2 // the golden ratio
	};
}

Calculator.builtins = "fact,ave,dice,round,sign,ctof,ftoc,randint,ln,rnd,rand,log,exp,sqrt,asin,acos,atan,atan2,sin,cos,tan,ceil,floor,max,min,random".split(",");
Calculator.internals = "pi,recip,cbrt,root,radians,degrees,sec,csc,cot,asec,acsc,coth,sech,csch,acoth,asech,acsch,cosh,sinh,tanh,acosh,asinh,atanh".split(",");

Calculator.funcs = {
	aucgbot: undefined, // protect the bot
	module: undefined, // protect the module
	system: undefined, // protect the system
	process: undefined, // protect the process
	console: undefined, // protect the console
	global: undefined, // protect the world
	root: undefined, // protect the roots of the trees in our forest
	window: undefined, // don't open the window
	close: undefined, // close the door
	open: undefined, // open your eyes
	sleep: undefined, // no, you may not sleep
	assert: undefined, // today is not the day to be assertive
	super: undefined, // you may not have superpowers
	export: undefined, // you may not export your goods
	exports: undefined,
	require: undefined, // you are required to behave
	load: undefined, // keep it light
	run: undefined, // don't run, walk
	quit: undefined, // quitters are losers
	exit: undefined, // please exit the stage
	Function: undefined,

	fact: function fact(x) {
		x = x|0;
		var e = +1;

		// We can't calculate factorials past 170, we get Infinity.
		if (x > 170)
			return Infinity;

		// Non-negative integers only.
		if (x < 0)
			return NaN;

		while (x > 1)
			e *= x--;
		return e;
	},

	ave: function ave() {
		var sum = +0;
		for (var i = arguments.length - 1; i >= 0; i--)
			sum += +arguments[i];
		return sum / arguments.length;
	},

	// dice: partially from cZ dice plugin.
	// waiting for JSDB to update
	dice: function dice(sides, count) {
		sides = sides|0 || 6;
		count = count|0 || 1;
		var sum = 0;

		// Prevent DoS.
		if (count > 1000) {
			sum = sum + randint(count, sides * count);
		} else {
			for (; count > 0; count = count - 1) {
				sum = sum + randint(1, sides);
			}
		}

		return sum;
	},

	round: function round(x, m) {
		x = +x;
		m = +m || 1;
		return +(Math.round(x / m) * m);
	},

	// ES6 shim, can be removed once we have Math.sign
	sign: function sign(x) {
		x = +x;
		if (x < 0)
			return -1;
		if (x > 0)
			return +1;
		return x;
	},

	// used by calcbot.jsm, keep them public
	ctof: function ctof(temp) {
		temp = +temp;
		return +(temp * 1.8 + 32);
	},
	ftoc: function ftoc(temp) {
		temp = +temp;
		return +((temp - 32) / 1.8);
	},

	ln: Math.log,
	rnd: Math.random,
	rand: Math.random,
	__proto__: Math
};

// TODO: Replace this entire function with a parser.
Calculator.prototype.calc =
function calc(expr) {
	const pi = Math.PI;
	expr = expr.replace(/(?:answer to |meaning of |)(?:(?:the |)(?:ultimate |)question of |)life,* the universe,* (?:and|&) every ?thing/g, "42").replace("speed of light", "c")
		.replace(/math\w*|\?+$|calc(?:ulat(?:e|or)|)|imum|olute|ing|er|the|of/g, "").replace(/(a|)(?:r(?:c|ea|)|)(cos|sin|tan|csc|sec|cot)\w+?(h|)/g, "$1$2$3").replace("#", "0x", "g").replace(/\b([0-9a-f])h\b/, "0x$1", "g")
		.replace(/(?:sq(?:uare|) ?|)root|\u221A/g, "sqrt").replace("\u03C0", "pi", "g").replace("\u03C6", "phi", "g").replace("\xB9"/*^1*/, "", "g").replace("\xB2", "**2", "g").replace("\xB3", "**3", "g")
		.replace("\xD7"/*x*/, "*", "g").replace("\u22C5"/*dot*/, "*", "g").replace("\xF7"/*sign*/, "/", "g").replace("\u2215"/*slash*/, "/", "g").replace("\u2044"/*fraction*/, "/", "g")
		.replace("\u2260", "!=", "g").replace("\u2264", "<=", "g").replace("\u2265", ">=", "g").replace(/(recip|fact|randint|sqrt|(?:co|)sec|(?:sin|cos|csc|cot|tan)h?)[^ ()]*\b/g, "$1").replace(/(\d+|)d(\d+)/g, "dice($2,$1)")
		.replace("sgn", "sign", "g").replace(/ra?nd(?:om|) ?(?!\()/, "rnd()").replace(/ave\w+|mean/, "ave").replace(/(sqrt|atan2|(?:sin|cos|tan|csc|sec|cot)h?|round|floor|ceil|log|exp|recip) (\d+(?:\.\d+|!*)|\.\d+)/g, "$1($2)")
		.replace(/(\d+(?:\.\d+(?:e[+\-]?\d(?:\.\d+))|!*)|\.\d+|ph?i|e) ?\*\* ?([+\-]?\d+(?:\.\d+(?:e[+\-]?\d(?:\.\d+))|!*)|\.\d+|ph?i|e)/g, "pow($1,$2)").replace(/(\d+)!/g, "fact($1)")
		.replace(/\b(\d+(?:\.\d+|)|\.\d+|_) ?([(a-df-wyz_])/g, "$1*$2").replace(/\b(ph?i|[e_]) ?([^+*\/&|\^<>%=),?: \-])/g, "$1*$2").replace(/(\(.*?\)) ?([^+*\/&|\^<>%!),?: \-])/g, "$1*$2");

	// FIXME "pow(pow(a,b),c) ** x" becomes "pow(pow(a,pow(b),c),x)"!
	while (/pow\(.+,.+\) ?\*\* ?[+\-]?(\d+(\.\d|!?)|\.\d)/.test(expr) || /\w*\(.+\)!/.test(expr)) {
		expr = expr.replace(/pow(\(.+?,)(.+?)\) ?\*\* ?([+\-]?(\d+(?:\.\d+|!*)|\.\d+))/g, "pow$1pow($2,$3))").replace(/(\w*\(.+?\))!/g, "fact($1)");
	}

	var vars = this.vars, lhs = expr.match(/\b[a-z_]\w*(?= ?=[^=])/g);
	if (lhs) {
		lhs.forEach(function (v) {
			if (!Calculator.internals.contains(v)) {
				vars[v] = vars[v];
			}
		});
	}

	with (vars) {
		vars.ans = vars._ = +eval(expr);
	}

	if (lhs) {
		Calculator.builtins.forEach(function (v) delete vars[v]);
	}
	return expr;

	function recip(x) 1 / x;
	function cbrt(x) pow(x, 1 / 3);
	function root(z, x) pow(z, 1 / x);
	function degrees(z) z * 180 / pi;
	function radians(z) z * pi / 180;

	// trigonometry
	// some of these are ES6 shims
	function sec(z) 1 / cos(z);
	function csc(z) 1 / sin(z);
	function cot(z) cos(z) / sin(z);
	function asec(z) acos(1 / z);
	function acsc(z) asin(1 / z);
	function acot(z) atan(1 / z);
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
};
