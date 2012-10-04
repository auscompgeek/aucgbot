// -*- Mode: JavaScript; tab-width: 4 -*- vim:tabstop=4 syntax=javascript:
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

// PLEASE NOTE: if you edit the badwords list using the rc js command, use
// "rc js this.modules["badword"].parseList()" otherwise it will not work

module.version = "4.4.1 (4 Oct 2012)";
module.count = {}; module.sfwChans = [];

module.parseList =
function parseList() {
	var badwords = [];
	for (word in this.badwords) badwords.push(this.badwords[word]);
	this.badwordList = badwords.join("|");
}
module.loadCount =
function loadCount() {
	try {
		var file = new Stream("badword.json");
		this.count = JSON.parse(file.readFile());
		file.close();
	} catch (ex) {}
}
module.saveCount =
function saveCount() {
	var file = new Stream("badword.json", "w");
	file.write(JSON.stringify(this.count));
	file.close();
}

module.badwords = { // "Word": "case-insensitive quoted regex",
	"Arse": "arse",
	"Asian": "as(ia|ai)n",
	"Ass": "\\ba[s$]{2}(holes?|es)?\\b|lmf?ao",
	"Bastard": "bastard",
	"Bitch": "b[i*\\-!]a?tch",
	"Bloody": "bloody",
	"Boob": "b[o0]{2}b",
	"Butt": "butt",
	"Cock": "cock",
	"Coon": "coon",
	"Crap": "crap",
	"Cripple": "cripple",
	"Cum": "cum",
	"Cunt": "[ck][u*\\-]*nt|\\bhk\\b",
	"Damn": "d[a*\\-@]y*(?:um|mn)|dammit",
	"Dick": "d[i*\\-!]ck",
	"Fag": "fags?\\b",
	"Faggot": "faggot",
	"Fuck": "f[ua*\\-](?:[cr*\\-]?[k*\\-]|q)|\\bfk|f(?:cu|sc)king|wh?[au]t [dt][aeh]+ f|wtf|fml|cbf|omfg|stfu|gtfo|lmfao|fubar",
	"Gay": "g(a|he)y",
	"God": "g[o*\\-]d|GERD|omf?g",
	"Heck": "\\bheck",
	"Hell": "hell",
	"Idiot": "idiot",
	"Jerk": "jerk",
	"Jew": "jew",
	"LOL": "lol|lawl|lulz",
	"Midget": "midget",
	"Nigger": "nigger",
	"Piss": "p[i*\\-!]ss",
	"Porn": "p(?:r[o0]|[o0]r)n\b", // pornography is legit
	"Prick": "pr[i*\\-!]ck",
	"Pussy": "puss(?:y\\b|ies)",
	"Queer": "queer",
	"Retard": "retard",
	"Screw you": "screw (?:yo)?u",
	"Shit": "s[h*\\-#][i*\\-!][t*\\-]",
	"Shut up": "shut(?: the \\S+)? up|stfu",
	"Slut": "sl[u*\\-]t",
	"Spastic": "spastic",
	"Stupid": "stupid",
	"Tit": "\\btit", // quantitative is not a bad word
	"Turd": "turd",
	"Twat": "twat",
	"Wank": "wank",
	"Whore": "whore",
	"Wuss": "wuss",
	"iPhone": "iPhone"
}
module.parseList();
module.loadCount();

module.onMsg =
function onMsg(dest, msg, nick, ident, host, conn) {
	var nick = nick.split("|")[0].toLowerCase(), count = this.count[nick], word, words;
	if (dest != nick) for (let i = this.sfwChans.length - 1; i >= 0; i--)
		if (this.sfwChans[i] == dest) {
			var dest = nick;
			break;
		}
	if (/^!badwords?\b/.test(msg)) {
		msg = msg.split(" "), word = msg[2];
		if (msg[1])
			nick = msg[1].split("|")[0].toLowerCase(), count = this.count[nick];
		if (!count)
			conn.msg(dest, "No bad words have been said by", nick, "...yet...");
		else if (word) {
			// is it a valid badword?
			if (this.badwords[word] || this.badwords[(word = word[0].toUpperCase() + word.slice(1))]) {
				if (msg[3] && host.match(aucgbot.prefs.suHosts)) {
					if (!count) count = this.count[nick] = {};
					if (!count[word]) count[word] = 0;
					count[word] += parseInt(msg[3]);
					this.saveCount();
				} else
					conn.msg(dest, nick, "said `" + word + "'", count[word], "times!");
			} else if (word.toLowerCase() == "total") {
				var sum = 0;
				for each (let word in count)
					sum += word;
				conn.msg(dest, nick, "said a total of", sum, "bad words!");
			}
		} else {
			words = [];
			for (let word in count)
				words.push(word + ": " + count[word]);
			conn.msg(dest, "Bad words said by", nick + ":", words.join(" - "));
		}
		return true;
	}
	if (!msg.match(this.badwordList, "i")) return;
	if (!count) count = this.count[nick] = {};
	for (let word in this.badwords)
		if (words = msg.match(this.badwords[word], "gi")) {
			if (!count[word]) count[word] = 0;
			count[word] += words.length;
		}
	this.saveCount();
}