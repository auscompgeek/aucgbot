// -*- Mode: JavaScript; tab-width: 4 -*- vim:tabstop=4 syntax=javascript:
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

// PLEASE NOTE: if you edit the badwords list using the rc js command, use
// "rc js this.modules["badword"].parseList()" otherwise it will not work

module.version = "4.3.3 (20 Aug 2012)";
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
	"Cock": "cock",
	"Coon": "coon",
	"Crap": "crap",
	"Cripple": "cripple",
	"Cum": "cum",
	"Cunt": "[ck][u*\\-]*nt|\\bhk\\b",
	"Damn": "d[a*\\-@]y*(?:um|mn)|dammit",
	"Dick": "d[i*\\-!]ck",
	"Fag": "fag",
	"Fuck": "f[ua*\\-](?:[cr*\\-][k*\\-]|q)|fk|f(?:cu|sc)king|wh?[au]t [dt][aeh]+ f|wtf|fml|cbf|omfg|stfu|gtfo|lmfao|fubar",
	"Gay": "g(a|he)y",
	"God": "g[o*\\-]d|omf?g",
	"Heck": "\\bheck",
	"Hell": "hell",
	"Idiot": "idiot",
	"Jerk": "jerk",
	"Jew": "jew",
	"LOL": "lol|lawl|lulz",
	"Midget": "midget",
	"Nigger": "nigger",
	"Piss": "p[i*\\-!]ss",
	"Porn": "p(?:r[o0]|or)n\b", // pornography is legit
	"Prick": "pr[i*\\-!]ck",
	"Pussy": "puss(?:y\\b|ies)",
	"Queer": "queer",
	"Retard": "retard",
	"Screw you": "screw (?:yo)?u",
	"Shit": "s[h*\\-#][i*\\-!][t*\\-]",
	"Shut up": "shut(?: the \S+)? up|stfu",
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
function onMsg(dest, msg, nick, ident, host, serv) {
	var word, words, msgParts = msg.split(" "), nick = nick.toLowerCase();
	if (dest != nick) for (let i = 0; i < this.sfwChans.length; i++)
		if (this.sfwChans[i] == dest) {
			var dest = nick;
			break;
		}
	if (/^!badwords?$/.test(msgParts[0])) {
		nick = msgParts[1] ? msgParts[1].toLowerCase() : nick;
		word = msgParts[2];
		if (word && (this.badwords[word] || // is it a valid badword?
		   this.badwords[(word = word[0].toUpperCase() + word.slice(1))])) {
			if (msgParts[3] && host.match(aucgbot.prefs.suHosts))
			{	if (!this.count[nick]) this.count[nick] = {};
				if (!this.count[nick][word]) this.count[nick][word] = 0;
				this.count[nick][word] += parseInt(msgParts[3]);
				this.saveCount();
			} else if (!this.count[nick])
				aucgbot.msg(serv, dest, "No bad words have been said by", nick, "...yet...");
			else
				aucgbot.msg(serv, dest, nick, "said `" + word + "'", this.count[nick][word], "times!");
		} else if (!this.count[nick])
			aucgbot.msg(serv, dest, "No bad words have been said by", nick, "...yet...");
		else if (word && word.toLowerCase() == "total") {
			var num = 0;
			for (let word in this.count[nick])
				num += this.count[nick][word];
			aucgbot.msg(serv, dest, "Total number of bad words said by", nick + ":", num);
		} else {
			words = [];
			for (let word in this.count[nick])
				words.push(word + ": " + this.count[nick][word]);
			aucgbot.msg(serv, dest, "Bad words said by", nick + ":", words.join(" - "));
		}
		return true;
	}
	if (!msg.match(this.badwordList, "i")) return;
	if (!this.count[nick]) this.count[nick] = {};
	for (let word in this.badwords)
		if (words = msg.match(this.badwords[word], "gi")) {
			if (!this.count[nick][word]) this.count[nick][word] = 0;
			this.count[nick][word] += words.length;
		}
	this.saveCount();
}