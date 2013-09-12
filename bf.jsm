// -*- Mode: JavaScript; tab-width: 4 -*- vim:tabstop=4 syntax=javascript:
/*jshint expr: true, es5: true, esnext: true */
/*global module: false */

module.version = 1.5;
module.MAX_LOOP_TIMES = 1000;
module.input = "You know it's rude to stare, right?";

// http://code.google.com/p/jslibs/wiki/JavascriptTips#Brainfuck_interpreter
module.cmd_bf = function cmd_bf(dest, code, nick, ident, host, conn, relay) {
	var out = "", loopIn = [], loopOut = [];

	for (var i = 0, arr = []; i < code.length; i++) {
		if (code[i] == "[")
			arr.push(i);
		else if (code[i] == "]")
			loopOut[loopIn[i] = arr.pop()] = i;
	}

	for (var cp = 0, dp = 0, l = this.MAX_LOOP_TIMES, ip = 0, m = {}; cp < code.length && l > 0; cp++, l--) {
		switch (code[cp]) {
			case ">": dp++; break;
			case "<": dp--; break;
			case "+": m[dp] = ((m[dp]||0)+1)&255; break;
			case "-": m[dp] = ((m[dp]||0)-1)&255; break;
			case ".": out += String.fromCharCode(m[dp]); break;
			case ",": m[dp] = this.input.charCodeAt(ip++)||0; break;
			case "[": m[dp]||(cp=loopOut[cp]); break;
			case "]": cp = loopIn[cp]-1; break;
		}
	}

	conn.reply(dest, nick, out.replace("\n", " ", "g"));
	return true;
};
