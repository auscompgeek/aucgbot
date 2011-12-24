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

// PLEASE NOTE: if you edit the badwords list using the rc js command, use
// "rc js this.modules["badword"].parseList()" otherwise it will not work

module.version = "4.2 (9 Dec 2011)";
module.count = {}; module.sfwChans = [];

module.parseList =
function parseList()
{	var badwords = [];
	for (word in this.badwords) badwords.push(this.badwords[word]);
	this.badwordList = badwords.join("|");
}
module.loadCount =
function loadCount()
{	try
	{	var file = new Stream("badword.json");
		this.count = JSON.parse(file.readln());
		file.close();
	} catch (ex) {}
}
module.saveCount =
function saveCount()
{	var file = new Stream("badword.json", "w");
	file.write(JSON.stringify(this.count));
	file.close();
}

module.badwords = // "Word": "case-insensitive quoted regex",
{	"Arse": "arse",
	"Ass": "\\ba[s$]{2}(holes?|es)?\\b|lmf?ao",
	"Bastard": "bastard",
	"Bitch": "b[i*\\-!]a?tch",
	"Bloody": "bloody",
	"Boob": "b[o0]{2}b",
	"Cock": "cock",
	"Crap": "crap",
	"Cripple": "cripple",
	"Cunt": "[ck]unt|\\bhk\\b",
	"Damn": "d[a*\\-@]y*(?:um|mn)|dammit",
	"Dick": "d[i*\\-!]ck",
	"Fag": "fag",
	"Fuck": "f[u*\\-](?:[c*\\-][k*\\-]|q)|f(?:cu|sc)king|wh?[au]t [dt][aeh]+ f|wtf|fml|cbf|omfg|stfu|gtfo|lmfao|fubar",
	"Gay": "gay",
	"God": "g[o*\-]d|omf?g",
	"Heck": "heck",
	"Hell": "hell",
	"Idiot": "idiot",
	"Jerk": "jerk",
	"LOL": "lol",
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
	"Tit": "\btit", // quantitative is not a bad word
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
function onMsg(dest, msg, nick, host, at, serv)
{	var word, words, msgParts = msg.split(" ");
	if (at) for (i in this.sfwChans)
		if (this.sfwChans[i] == dest)
		{	dest = nick;
			break;
		}
	if (/^!badwords?$/.test(msgParts[0]))
	{	nick = msgParts[1] || nick;
		word = msgParts[2];
		if (word && (this.badwords[word] || // is it a valid badword?
		    this.badwords[(word = word[0].toUppercase() + word.substring(1))]))
			if (msgParts[3])
			{	if (!this.count[nick]) this.count[nick] = {};
				if (!this.count[nick][word]) this.count[nick][word] = 0;
				this.count[nick][word] += parseInt(msgParts[3]);
				this.saveCount();
			} else if (!this.count[nick])
				aucgbot.msg(dest, "No bad words have been said by", nick, "...yet...");
			else
				aucgbot.msg(dest, nick, "said `" + word + "'", this.count[nick][word], "times!");
		else if (!this.count[nick])
			aucgbot.msg(dest, "No bad words have been said by", nick, "...yet...");
		else if (word && word.toLowercase() == "total")
		{	var num = 0;
			for (word in this.count[nick]) num += this.count[nick][word];
			aucgbot.msg(dest, "Total number of bad words said by", nick + ":", num);
		} else
		{	words = [];
			for (word in this.count[nick]) words.push(word + ": " + this.count[nick][word]);
			aucgbot.msg(dest, "Bad words said by", nick + ":", words.join(" - "));
		}
		return true;
	}
	if (!msg.match(this.badwordList, "i")) return;
	if (!this.count[nick]) this.count[nick] = {};
	for (word in this.badwords)
		if (words = msg.match(this.badwords[word], "gi"))
		{	if (!this.count[nick][word]) this.count[nick][word] = 0;
			this.count[nick][word] += words.length;
		}
	this.saveCount();
}