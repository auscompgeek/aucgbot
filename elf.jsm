// -*- Mode: JavaScript; tab-width: 4 -*- vim:tabstop=4 syntax=javascript:
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
/*global Stream: false, aucgbot: false, module: false, println: false, randint: false */

module.version = "1.3.2 (21 Jan 2012)";
module.prefix = "$";
module.chan = "##elf";

module.initScores = function initScores() {
	this.scores = { score: {}, coins: {}, materials: {}, reputation: {}, total: {} };
	println("[ELF] Initialised scores database.");
};
module.initScores();

module.loadScores = function loadScores() {
	try {
		var file = new Stream("elfscores.json");
		this.scores = JSON.parse(file.readFile());
		file.close();
	} catch (ex) {}
};
module.loadScores();

module.saveScores = function saveScores() {
	var file = new Stream("elfscores.json", "w");
	file.write(JSON.stringify(this.scores));
	file.close();
};

module.parseln = function parseln(ln, conn) {
	if (!/^:([^\s!@]+)![^\s!@]+@[^\s!@]+ JOIN :?(\S+)\r/.test(ln) || RegExp.$2 != this.chan || RegExp.$1 == conn.nick)
		return false;
	var nick = RegExp.$1;
	if (this.scores.score[nick]) {
		conn.send("NOTICE", nick, ":[" + this.chan + "] Welcome back", nick + ". You have",
			this.scores.score[nick], "points,", this.scores.coins[nick], "coins and",
			this.scores.materials[nick], "materials.");
	} else {
		this.scores.coins[nick] = this.scores.reputation[nick] = this.scores.total[nick] = 0;
		this.scores.score[nick] = 1;
		this.scores.materials[nick] = 5;
		conn.send("NOTICE", nick, ":[" + this.chan + "] Hey! It looks like you are new!",
			"You have been given 5 free materials to get you started.",
			"Type", this.prefix + "rules for more info on the game.",
			"Start by making some toys with", this.prefix + "make.");
	}
	return true;
};
module.onMsg = function onMsg(dest, msg, nick, ident, host, conn, relay) {
	if (this.prefix && msg.slice(0, this.prefix.length) != this.prefix)
		return false;
	msg = msg.slice(this.prefix.length).toLowerCase().split(" ");
	switch (msg[0]) {
	case "info":
		nick = msg[1] || nick;
		if (this.scores.score[nick])
			conn.reply(dest, nick,
				this.scores.score[nick], "points,", this.scores.materials[nick], "materials,",
				this.scores.coins[nick], "coins,", this.scores.reputation[nick], "reputation, made",
				this.scores.total[nick], "toys.");
		else
			conn.msg(dest, nick, "has not joined the elf game yet. Try inviting him/her perhaps.");
		return true;
	case "buy":
		switch (msg[1]) {
		case "material":
			var n = parseInt(msg[2]) || 1, cost = n * 2;
			if (this.scores.coins[nick] >= cost) {
				this.scores.coins[nick] -= cost;
				this.scores.materials[nick] += n;
				conn.msg(this.chan, nick, "has bought", n, "materials. This has cost", cost, "in total.");
			}
			break;
		case "voice":
			if (this.scores.coins[nick] >= 800) {
				this.scores.coins[nick] -= 800;
				aucgbot.log(conn, "ELF VOICE", nick);
				//conn.send("CS VOP", this.chan, "ADD", nick);
				conn.send("CS ACCESS", this.chan, "ADD", nick, "VOP");
				conn.send("MODE", this.chan, "+v", nick);
			}
			break;
		case "hop": case "halfop":
			if (this.scores.coins[nick] >= 7500) {
				this.scores.coins[nick] -= 7500;
				aucgbot.log(conn, "ELF HOP", nick);
				//conn.send("CS HOP", this.chan, "ADD", nick);
				conn.send("CS ACCESS", this.chan, "ADD", nick, "HOP");
				conn.send("MODE", this.chan, "+vh", nick, nick);
			}
			break;
		case "op":
			if (this.scores.coins[nick] >= 20000) {
				this.scores.coins[nick] -= 20000;
				aucgbot.log(conn, "ELF OP", nick);
				//conn.send("CS AOP", this.chan, "#elf ADD", nick);
				conn.send("CS", this.chan, "#elf ADD", nick, "AOP");
				conn.send("MODE", this.chan, "+ohv", nick, nick, nick);
			}
			break;
		default:
			conn.msg(dest, "material [amount]: costs twice the amount, so if you bought 4, you would pay 8 coins.");
			conn.msg(dest, "voice: costs 800 coins. - hop: costs 7500 coins. - op: costs 20000 coins.");
			conn.msg(dest, nick, "currently has", this.scores.coins[nick], "coins.");
		}
		this.saveScores();
		return true;
	case "make":
		if (!this.scores.materials[nick])
			conn.send("NOTICE", nick, ":You don't have enough materials to make a toy.");
		else {
			this.scores.materials[nick]--;
			this.scores.total[nick]++;
			switch (randint(1, 4)) {
			case 1:
				this.scores.score[nick] += 100;
				this.scores.coins[nick] += 150;
				this.scores.reputation[nick] += 250;
				conn.msg(this.chan, nick, "makes a toy car.",
					"The toy car is fine but is a little scratched.",
					nick, "gets 100 points and 150 coins.");
				break;
			case 2:
				this.scores.score[nick] += 500;
				this.scores.coins[nick] += 300;
				this.scores.reputation[nick] += 750;
				conn.msg(this.chan, nick, "makes a toy car.",
					"The toy car is perfectly made and Santa is very happy.",
					nick, "gets 500 points and 300 coins.");
				break;
			case 3:
				this.scores.score[nick] += 50;
				this.scores.coins[nick] += 50;
				this.scores.reputation[nick] += 150;
				conn.msg(this.chan, nick, "makes a teddy bear.",
					"The teddy bear is poorly made and is nearly falling apart. Santa is not happy.",
					nick, "gets 50 points and 50 coins.");
				break;
			case 4:
				this.scores.score[nick] += 250;
				this.scores.coins[nick] += 150;
				this.scores.reputation[nick] += 500;
				conn.msg(this.chan, nick, "makes a teddy bear.",
					"The teddy bear is in good condition and is ready to sell.",
					nick, "gets 250 points and 150 coins.");
				break;
			}
		}
		this.saveScores();
		return true;
	case "rules":
		conn.msg(dest, "buy: Buy items to use in the game. - make: Make a toy. - info: Show your current scores.");
		return true;
	case "elfreset":
		if (aucgbot.isSU(nick, ident, host)) {
			this.initScores();
			aucgbot.log(conn, "ELF RESET", nick + (dest != nick ? " in " + dest : ""));
			conn.msg(this.chan, "Variables reset!!!");
		}
		return true;
	case "reloadscores":
		this.loadScores();
		conn.msg(this.chan, "Scores reloaded.");
		return true;
	case "writescores":
		this.saveScores();
		return true;
	}
};
