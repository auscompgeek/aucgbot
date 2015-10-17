// -*- Mode: JavaScript; tab-width: 4 -*- vim:tabstop=4 syntax=javascript:
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
/*jshint es5: true, esnext: true, forin: true, proto: true */
/*global aucgbot: false, module: false */

// PLEASE NOTE: if you edit the badwords list using the rc js command, also
// `this.modules.badword.parseList()` otherwise it will not work

(function (module) {
module.version = "5.4.1 (2015-01-19)";
module.db = {}, module.sfwChans = [];
module.DB_FILENAME = "badword.json";
module.spaceAfterColon = false;

module.parseList = function parseList() {
	var badwords = [];
	for (var word in this.badwords) {
		if (this.badwords.hasOwnProperty(word) && typeof this.badwords[word] === "string")
			badwords.push(this.badwords[word]);
	}
	this.badwordList = RegExp(badwords.join("|"));
};
module.loadDB = function loadDB() {
	try {
		this.db = JSON.parse(aucgbot.readFile(this.DB_FILENAME));
	} catch (ex) {}
	/* hasOwnProperty __proto__ hack: __proto__ === null => hasOwnProperty returns false
	 *
	 * We don't want to define __proto__ if __proto__ has been removed
	 * or if hasOwnProperty("__proto__") => false already.
	 * This seems to have interesting effects.
	 * Do not use this unless you really need it and it actually works properly.
	 *
	 * uneval(obj): "null"
	 * Boolean(obj), !!obj: true
	 * JSON.stringify(obj): {...}
	 * String(obj): TypeError: can't convert obj to string
	 * obj + "": TypeError: can't convert obj to primitive type
	 * Number(obj), +obj: TypeError: can't convert obj to number
	 * Firefox web console: TypeError: can't convert null to primitive type
	 *                                            wat^
	 * v8: Object.hasOwnProperty(obj, x): TypeError: Cannot convert object to primitive value
	 */
	//if (this.db.__proto__ === Object.prototype && Object.prototype.hasOwnProperty.call({}, "__proto__"))
		//this.db.__proto__ = null;
};
module.saveDB = function saveDB() {
	aucgbot.writeFile(this.DB_FILENAME, JSON.stringify(this.db));
};
/**
 * Get a user's database entry.
 *
 * @param {string} nick User's nickname.
 * @param {boolean} [create] Whether the entry should be created if it does not exist.
 * @param {boolean} [noAlts] Whether to not recursively get alternate nicks.
 * @return {Object} The database entry.
 */
module.getUser = function getUser(nick, create, noAlts) {
	const name = nick.toLowerCase();
	var db;
	// We shall forever marvel at the wonders of __proto__... </sarcasm>
	if ((Object.prototype.hasOwnProperty.call(this.db, name) || name === "__proto__") && // hasOwnProperty("__proto__") always returns false in newer SpiderMonkeys
			(name !== "__proto__" || (this.db[name] && this.db[name] !== Object.prototype)) && // check if __proto__ has been changed
			typeof this.db[name] === "object" && this.db[name]) {
		db = this.db[name];
		if (!noAlts && db.nick && db.nick.toLowerCase() !== name)
			return this.getUser(db.nick, create) || db;
	} else if (create) {
		db = this.db[name] = {};
		if (nick !== name)
			db.nick = nick;
	}
	return db;
};

module.badwords = {
// "Word": "lowercase quoted regex",
	"Arse": "\\barse\\b",
	"Asian": "as(?:ia|ai)n",
	"Ass": "\\ba[s$]{2}(?:holes?|es)?\\b|lmf?ao",
	"Bastard": "bastard|bofh",
	"Bitch": "b[i!*-]a?tch|\\b(?:b word\\b|female dog)",
	"Black": "black",
	"Bloody": "bloody",
	"Boob": "b[o0]{2}b|\\b(?:8008(?:135|)|5318008)\\b",
	"Bum": "bum",
	"Butt": "butt",
	"Chinese": "chinese",
	"Cock": "cock",
	"Coon": "coon",
	"Crap": "crap",
	"Cripple": "cripple",
	"Cum": "\\bcum(?:s(?:tain|)|)\\b",
	"Cunt": "[ck][u*-]*nt|\\bhk\\b",
	"Damn": "d[a@*-]y*(?:um|mn)|dammit",
	"Dick": "d[i!*-]ck|smd",
	"Dimwit": "dimwit",
	"Donkey": "donkey",
	"Dork": "dork",
	"Dumb": "dumb",
	"Dweeb": "dweeb",
	"Fag": "fags?\\b",
	"Faggot": "fagg[oe]t",
	"Fart": "fart",
	"Fap": "\\bfap",
	"Fuck": "f(?:u+a*|oo|[*-])[crw*-]?[kq*-]|d(?:a|er)faq|\\bfk|f(?:cu|sc)kin|wh?[au]t [dt][aeh]+ f|wtf|fml|cbf|omfg|stfu|gtfo|lmfao|fubar|idgaf|\\bf word\\b",
	"Gay": "g(?:a+|he+)y",
	"God": "g(?:[o*-]|er|aw)d|omf?g|oh em gee",
	"Gronk": "gronk",
	"Hack": "hack",
	"Heck": "\\bheck",
	"Hell": "hell\\b|wth|bofh",
	"Hoe": "h[o*-]e",
	"Idiot": "idiot",
	"Jeez": "jeez",
	"Jerk": "jerk",
	"Jesus": "jesus",
	"Jew": "jews?\\b",
	"Leb": "\\blebs?\\b",
	"LOL": "lol|\\b(?:l[ea]l|kek)\\b|lawl|lulz|el oh el",
	"Midget": "midget",
	"Moron": "moron",
	"Nerd": "nerd",
	"Nigger": "ni[gq]{2,}(?:er|a)",
	"Noob": "noob",
	"Pee": "pee\\b",
	"Penis": "penis|\\bp word\\b",
	"Pirate": "pirate",
	"Piss": "p[i!*-]ss",
	"Pleb": "pleb",
	"Poon": "\\bpoon",
	"Poo": "poos?\\b",
	"Poop": "poop",
	"Porn": "p(?:r[o0]|[o0]r)n(?:star|)[sz]?\\b",
	"Prick": "pr[i!*-]ck",
	"Pussy": "puss(?:y\\b|ies)",
	"Queer": "queer",
	"Retard": "retard",
	"Screw you": "screw (?:yo|)u",
	"Seems legit": "seems legit",
	"Shat": "shat",
	"Shit": "s[h#*-][ie1!*-]+[t7*-]|\\$#[i1!][t7]|\\bs word\\b",
	"Shut up": "shut(?:(?: the \\S+|) up| the front door| (?:your|yo|ur) pie hole)|stfu",
	"Slut": "sl[u*-]t",
	"Spastic": "spastic",
	"Stuff": "stuff",
	"Stupid": "st(?:u|oo)pid",
	"Swag": "sw[ae]g",
	"Thingy": "thingy",
	"Tit": "\\b(?:tit(?:tie|)s?|tolo|toftb)\\b",
	"Torrent": "torrent",
	"Turd": "turd",
	"Twat": "twat",
	"Twit": "twit",
	"Vag": "vag\\b",
	"Vagina": "vagina",
	"Wank": "wanks?\\b",
	"Wanker": "wanker",
	"Whore": "whore",
	"Wuss": "wuss",
	"YOLO": "\\byolo\\b|u only live once",
	"iPhone": "iphone"
};
module.parseList();
module.loadDB();

module.onMsg = function onMsg(e) {
	var dest = e.dest, msg = e.msg, nick = e.nick, conn = e.conn;
	if (dest !== nick && this.sfwChans.indexOf(dest) !== -1)
		dest = nick;
	var db, word, words;
	if (/^!badwords?\b/.test(msg)) {
		msg = msg.split(" "), msg.shift();
		var name = msg.shift() || nick;
		name = name.split("|")[0], db = this.getUser(name), word = msg.shift(), msg = msg.join(" ");
		if (!db && !(word && msg && aucgbot.isSU(nick, ident, host)))
			conn.msg(dest, name, "hasn't said any bad words...yet...");
		else if (word) {
			if (word === "nick") {
				if (msg && aucgbot.isSU(nick, ident, host, dest, relay)) {
					if (!db)
						db = this.getUser(name, true);
					db.nick = msg;
				} else {
					if (!db.nick)
						db = this.getUser(name, false, true);
					conn.msg(dest, "Umm, the nick in the database is", db.nick, "but why are you asking?");
				}
			} else if (word.toLowerCase() === "total") {
				var sum = 0;
				for (word in db) {
					if (db.hasOwnProperty(word)) {
						var val = db[word];
						if (word === "nick")
							name = val;
						else if (typeof val === "number")
							sum += val;
					}
				}
				conn.msg(dest, name, "said a total of", sum, "bad words!");
			// Is it a valid badword? Take pity if the user didn't capitalise.
			} else if ((this.badwords.hasOwnProperty(word) || this.badwords.hasOwnProperty(word = word[0].toUpperCase() + word.slice(1))) && typeof this.badwords[word] === "string") {
				if (msg && aucgbot.isSU(e)) {
					if (!db)
						db = this.getUser(name, true);
					if (!db[word])
						db[word] = 0;
					db[word] += parseInt(msg); // missing radix intended
					this.saveDB();
				} else {
					conn.msg(dest, db.nick || name, "said '" + word + "'", db[word] || 0, "times!");
				}
			}
		} else {
			words = [];
			for (word in db) {
				if (db.hasOwnProperty(word)) {
					var val = db[word];
					if (word === "nick")
						name = val;
					else if (typeof val === "number")
						words.push(word + (this.spaceAfterColon ? ": " : ":") + val);
				}
			}
			conn.reply(dest, name, words.join(", "));
		}
		return true;
	}
	msg = msg.toLowerCase();
	if (!this.badwordList.test(msg))
		return;
	db = this.getUser(nick.split("|")[0], true);
	for (word in this.badwords) {
		if (this.badwords.hasOwnProperty(word) && typeof this.badwords[word] === "string" && (words = msg.match(this.badwords[word], "g"))) {
			if (!db[word])
				db[word] = 0;
			db[word] += words.length;
		}
	}
	this.saveDB();
};
})(module.exports);
