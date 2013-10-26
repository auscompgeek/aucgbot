// -*- Mode: JavaScript; tab-width: 4 -*- vim:tabstop=4 syntax=javascript:
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
/*global Stream: false, aucgbot: false, module: false, println: false, randint: false */

module.version = "2.1 (2013-10-26)";
module.prefix = "$";
module.chan = "##elf";
module.DB_FILENAME = "elf.csv";

module.initDB = function initDB() {
	this.db = new Table();
	this.db.setTitle(1, "nick");
	this.db.setTitle(2, "score");
	this.db.setTitle(3, "coins");
	this.db.setTitle(4, "materials");
	this.db.setTitle(5, "reputation");
	this.db.setTitle(6, "total");
	this.index = this.db.index("nick");
	println("[ELF] Initialised scores database.");
};
module.initDB();

module.loadDB = function loadDB() {
	try {
		this.db = new Table(this.DB_FILENAME);
		this.index = this.db.index("nick");
	} catch (ex) {}
};
module.loadDB();

module.saveDB = function saveDB() {
	this.db.save(this.DB_FILENAME, ",");
};

module.getUser = function getUser(nick) {
	var rowNo = this.index.find(nick);
	if (rowNo != -1)
		return this.db.getRow(rowNo);
};

module.updateUser = function updateUser(nick, data) {
	var rowNo = this.index.find(nick);
	if (rowNo == -1) {
		this.db.add(data);
		this.index.add(nick);
	} else {
		this.db.setRow(rowNo, data);
	}
};

module.parseln = function parseln(ln, conn) {
	if (!/^:([^\s!@]+)![^\s!@]+@[^\s!@]+ JOIN :?(\S+)\r/.test(ln) || RegExp.$2 != this.chan || RegExp.$1 == conn.nick)
		return false;
	var nick = RegExp.$1, data = this.getUser(nick);
	if (data) {
		data = data.toObject();
		conn.send("NOTICE", nick, ":[" + this.chan + "] Welcome back", nick + ". You have",
			data.score, "points,", data.coins, "coins and", data.materials, "materials.");
	} else {
		this.updateUser(nick, {coins: 0, reputation: 0, total: 0, score: 1, materials: 5});
		conn.notice(nick, "[" + this.chan + "] Hey! It looks like you're new!",
			"You have been given 5 free materials to get you started.",
			"Type", this.prefix + "rules for more info on the game.",
			"Start by making some toys with", this.prefix + "make.");
	}
	return true;
};
module.onMsg = function onMsg(e) {
	var dest = e.dest, msg = e.msg, nick = e.nick, conn = e.conn;
	if (this.prefix && msg.slice(0, this.prefix.length) != this.prefix)
		return false;
	msg = msg.slice(this.prefix.length).toLowerCase().split(" ");
	switch (msg[0]) {
	case "info":
		nick = msg[1] || nick;
		var data = this.getUser(nick);
		if (data) {
			data = data.toObject();
			conn.reply(dest, nick, data.score, "points,", data.materials, "materials,",
				data.coins, "coins,", data.reputation, "reputation, made", data.total, "toys.");
		} else {
			conn.msg(dest, nick, "has not joined the elf game yet. Try inviting him/her perhaps.");
		}
		return true;
	case "buy":
		var data = this.getUser(nick);
		if (!data) {
			conn.notice(nick, "You haven't joined the elf game yet. Join", this.chan, "to get started.");
			return true;
		}
		data = user.toObject();
		switch (msg[1]) {
		case "material":
			var n = parseInt(msg[2]) || 1, cost = n * 2;
			if (data.coins >= cost) {
				user.coins -= cost;
				data.materials += n;
				conn.msg(this.chan, nick, "has bought", n, "materials. This has cost", cost, "in total.");
			}
			break;
		case "voice":
			if (data.coins >= 800) {
				data.coins -= 800;
				aucgbot.log(conn, "ELF VOICE", nick);
				//conn.send("CS VOP", this.chan, "ADD", nick);
				conn.send("CS ACCESS", this.chan, "ADD", nick, "VOP");
				conn.send("MODE", this.chan, "+v", nick);
			}
			break;
		case "hop": case "halfop":
			if (data.coins >= 7500) {
				data.coins -= 7500;
				aucgbot.log(conn, "ELF HOP", nick);
				//conn.send("CS HOP", this.chan, "ADD", nick);
				conn.send("CS ACCESS", this.chan, "ADD", nick, "HOP");
				conn.send("MODE", this.chan, "+vh", nick, nick);
			}
			break;
		case "op":
			if (data.coins >= 20000) {
				data.coins -= 20000;
				aucgbot.log(conn, "ELF OP", nick);
				//conn.send("CS AOP", this.chan, "#elf ADD", nick);
				conn.send("CS", this.chan, "#elf ADD", nick, "AOP");
				conn.send("MODE", this.chan, "+ohv", nick, nick, nick);
			}
			break;
		default:
			conn.msg(dest, "material [amount]: costs twice the amount, so if you bought 4, you would pay 8 coins.");
			conn.msg(dest, "voice: costs 800 coins. - hop: costs 7500 coins. - op: costs 20000 coins.");
			conn.msg(dest, nick, "currently has", data.coins, "coins.");
		}
		this.updateUser(nick, data);
		this.saveDB();
		return true;
	case "make":
		var data = this.getUser(nick);
		if (!data) {
			conn.notice(nick, "You haven't joined the elf game yet. Join", this.chan, "to get started.");
			return true;
		}
		data = data.toObject();
		if (!data.materials)
			conn.notice(nick, "You don't have enough materials to make a toy.");
		else {
			data.materials--;
			data.total++;
			switch (randint(1, 4)) {
			case 1:
				data.score += 100;
				data.coins += 150;
				data.reputation += 250;
				conn.msg(this.chan, nick, "makes a toy car. The toy car is fine but is a little scratched.",
						nick, "gets 100 points and 150 coins.");
				break;
			case 2:
				data.score += 500;
				data.coins += 300;
				data.reputation += 750;
				conn.msg(this.chan, nick, "makes a toy car. The toy car is perfectly made and Santa is very happy.",
						nick, "gets 500 points and 300 coins.");
				break;
			case 3:
				data.score += 50;
				data.coins += 50;
				data.reputation += 150;
				conn.msg(this.chan, nick, "makes a teddy bear.",
					"The teddy bear is poorly made and is nearly falling apart. Santa is not happy.",
					nick, "gets 50 points and 50 coins.");
				break;
			case 4:
				data.score += 250;
				data.coins += 150;
				data.reputation += 500;
				conn.msg(this.chan, nick, "makes a teddy bear. The teddy bear is in good condition and is ready to sell.",
						nick, "gets 250 points and 150 coins.");
				break;
			}
		}
		this.updateUser(nick, data);
		this.saveDB();
		return true;
	case "rules":
		conn.msg(dest, "buy: Buy items to use in the game. - make: Make a toy. - info: Show your current scores.");
		return true;
	case "elfreset":
		if (aucgbot.isSU(e)) {
			this.initDB();
			aucgbot.log(conn, "ELF RESET", nick + (dest != nick ? " in " + dest : ""));
			conn.msg(this.chan, "Database reset!!!");
		}
		return true;
	case "reloadscores":
		this.loadDB();
		conn.msg(this.chan, "Scores reloaded.");
		return true;
	case "writescores":
		this.saveDB();
		return true;
	}
};
