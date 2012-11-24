// -*- Mode: JavaScript; tab-width: 4 -*- vim:tabstop=4 syntax=javascript:
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// PLEASE NOTE: if you edit the badwords list using the rc js command, use
// "rc js this.modules["badword"].parseList()" otherwise it will not work

module.version = "4.4.4 (19 Nov 2012)";
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
	"Asian": "as(?:ia|ai)n",
	"Ass": "\\ba[s$]{2}(?:holes?|es)?\\b|lmf?ao",
	"Bastard": "bastard",
	"Bitch": "b[i*\\-!]a?tch",
	"Black": "black",
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
	"Dork": "dork",
	"Fag": "fags?\\b",
	"Faggot": "fagg[oe]t",
	"Fart": "fart",
	"Fuck": "f[ua*\\-][crw*\\-]?[kq*\\-]|\\bfk|f(?:cu|sc)kin|wh?[au]t [dt][aeh]+ f|wtf|fml|cbf|omfg|stfu|gtfo|lmfao|fubar|idgaf",
	"Gay": "g(?:a|he)y",
	"God": "g[o*\\-]d|GERD|omf?g",
	"Heck": "\\bheck",
	"Hell": "hell",
	"Idiot": "idiot",
	"Jerk": "jerk",
	"Jew": "jew",
	"Leb": "leb\\b",
	"LOL": "lol|lawl|lulz",
	"Midget": "midget",
	"Nigger": "ni[gq]{2,}(?:er|a)",
	"Penis": "penis",
	"Piss": "p[i*\\-!]ss",
	"Porn": "p(?:r[o0]|[o0]r)n\b", // pornography is legit
	"Prick": "pr[i*\\-!]ck",
	"Pussy": "puss(?:y\\b|ies)",
	"Queer": "queer",
	"Retard": "retard",
	"Screw you": "screw (?:yo|)u",
	"Shit": "s[h*\\-#][ie*\\-!][t*\\-]",
	"Shut up": "shut(?: the \\S+|) up|stfu",
	"Slut": "sl[u*\\-]t",
	"Spastic": "spastic",
	"Stupid": "st(?:u|oo)pid",
	"Tit": "\\btit", // quantitative is not a bad word
	"Turd": "turd",
	"Twat": "twat",
	"Twit": "twit",
	"Wank": "wank",
	"Whore": "whore",
	"Wuss": "wuss",
	"YOLO": "YOLO|u only live once",
	"iPhone": "iPhone"
}
module.parseList();
module.loadCount();

module.onMsg =
function onMsg(dest, msg, nick, ident, host, conn) {
	if (dest != nick && this.sfwChans.indexOf(dest) == -1)
		dest = nick;
	var nick = nick.split("|", 1)[0].toLowerCase(), count = this.count[nick], word, words;
	if (/^!badwords?\b/.test(msg)) {
		msg = msg.split(" "), word = msg[2];
		if (msg[1])
			nick = msg[1].split("|", 1)[0].toLowerCase(), count = this.count[nick];
		if (!count)
			conn.msg(dest, "No bad words have been said by", nick, "...yet...");
		else if (word) {
			if (word.toLowerCase() == "total") {
				var sum = 0;
				for each (word in count)
					sum += word;
				conn.msg(dest, nick, "said a total of", sum, "bad words!");
			// Is it a valid badword? Take pity if the user didn't capitalise.
			} else if (this.badwords[word] || this.badwords[(word = word[0].toUpperCase() + word.slice(1))]) {
				if (msg[3] && host.match(aucgbot.prefs.suHosts)) {
					if (!count) count = this.count[nick] = {};
					if (!count[word]) count[word] = 0;
					count[word] += parseInt(msg[3]);
					this.saveCount();
				} else
					conn.msg(dest, nick, "said `" + word + "'", count[word], "times!");
			}
		} else {
			words = [];
			for (word in count)
				words.push(word + ": " + count[word]);
			conn.reply(dest, nick, words.join(" - "));
		}
		return true;
	}
	if (!msg.match(this.badwordList, "i")) return;
	if (!count) count = this.count[nick] = {};
	for (word in this.badwords)
		if (words = msg.match(this.badwords[word], "gi")) {
			if (!count[word]) count[word] = 0;
			count[word] += words.length;
		}
	this.saveCount();
}