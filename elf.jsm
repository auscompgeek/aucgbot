// -*- Mode: JavaScript; tab-width: 4 -*- vim:tabstop=4 syntax=javascript:
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

module.version = "1.2 (16 Jun 2012)";
module.prefix = "$";

module.initScores =
function initScores()
{	module.scores = { score: {}, coins: {}, materials: {}, reputation: {}, total: {} };
	println("[ELF] Initialised scores database.");
}
module.initScores();

module.loadScores =
function loadScores()
{	try
	{	var file = new Stream("elfscores.json");
		this.scores = JSON.parse(file.readln());
		file.close();
	} catch (ex) {}
}
module.loadScores();

module.saveScores =
function saveScores()
{	var file = new Stream("elfscores.json", "w");
	file.write(JSON.stringify(this.scores));
	file.close();
}

module.parseln =
function parseln(ln, serv)
{	if (/^:(\S+)!\S+@\S+ JOIN :?#elf\r/.test(ln) && RegExp.$1 != aucgbot.nick)
	{	var nick = RegExp.$1;
		if (this.scores.score[nick])
			aucgbot.msg(serv, "#elf", "Welcome back", nick + ". You have",
				this.scores.score[nick], "points,", this.scores.coins[nick], "coins and",
				this.scores.materials[nick], "materials.");
		else
		{	this.scores.coins[nick] = this.scores.reputation[nick] = this.scores.total[nick] = 0;
			this.scores.score[nick] = 1;
			this.scores.materials[nick] = 5;
			aucgbot.send(serv, "NOTICE", nick,
				":[#elf] Hey! It looks like you are new! You have been",
				"given 5 free materials to get you started. Type",
				this.prefix + "rules for more info on the game. Start",
				"by making some toys using", this.prefix + "make.");
		}
		return true;
	}
}
module.onMsg =
function onMsg(dest, msg, nick, host, at, serv, relay)
{	if (msg.substr(0, this.prefix.length) == this.prefix) // Starts with prefix.
	{	var msg = msg.substr(this.prefix.length).toLowerCase().split(" ");
		switch (msg[0])
		{	case "info":
				nick = msg[1] || nick;
				aucgbot.msg(serv, dest, nick + ":",
					this.scores.score[nick], "points,", this.scores.materials[nick], "materials,",
					this.scores.coins[nick], "coins,", this.scores.reputation[nick], "reputation, made",
					this.scores.total[nick], "toys.");
				return true;
			case "buy":
				switch (msg[1])
				{	case "material":
						var n = parseInt(msg[2]) || 1, cost = n * 2;
						if (this.scores.coins[nick] >= cost)
						{	this.scores.coins[nick] -= cost;
							this.scores.materials[nick] += n;
							aucgbot.msg(serv, "#elf", nick, "has bought", n,
								"materials. This has cost", cost, "in total.");
						}
						break;
					case "voice":
						if (this.scores.coins[nick] >= 800)
						{	this.scores.coins[nick] -= 800;
							//aucgbot.send(serv, "CS VOP #elf ADD", nick);
							aucgbot.send(serv, "CS ACCESS #elf ADD", nick, "VOP");
							aucgbot.send(serv, "MODE #elf +v", nick);
						}
						break;
					case "hop":
						if (this.scores.coins[nick] >= 7500)
						{	this.scores.coins[nick] -= 7500;
							//aucgbot.send(serv, "CS HOP #elf ADD", nick);
							aucgbot.send(serv, "CS ACCESS #elf ADD", nick, "HOP");
							aucgbot.send(serv, "MODE #elf +vh", nick, nick);
						}
						break;
					case "op":
						if (this.scores.coins[nick] >= 20000)
						{	this.scores.coins[nick] -= 20000;
							//aucgbot.send(serv, "CS AOP #elf ADD", nick);
							aucgbot.send(serv, "CS ACCESS #elf ADD", nick, "AOP");
							aucgbot.send(serv, "MODE #elf +ohv", nick, nick, nick);
						}
						break;
					default:
						aucgbot.msg(serv, dest, "material [amount]: costs twice the amount, so if you bought 4, you would pay 8 coins.");
						aucgbot.msg(serv, dest, "voice: costs 800 coins. - hop: costs 7500 coins. - op: costs 20000 coins.");
						aucgbot.msg(serv, dest, nick, "currently has", this.scores.coins[nick], "coins.");
				}
				this.saveScores();
				return true;
			case "make":
				if (this.scores.materials[nick] < 1)
					aucgbot.send(serv, "NOTICE", nick, ":You don't have enough materials to make a toy.");
				else
				{	this.scores.materials[nick]--;
					this.scores.total[nick]++;
					switch (ranint(1, 4))
					{	case 1:
							this.scores.score[nick] += 100;
							this.scores.coins[nick] += 150;
							this.scores.reputation[nick] += 250;
							aucgbot.msg(serv, "#elf", nick, "makes a toy car.",
								"The toy car is fine but is a little scratched.",
								nick, "gets 100 points and 150 coins.");
							break;
						case 2:
							this.scores.score[nick] += 500;
							this.scores.coins[nick] += 300;
							this.scores.reputation[nick] += 750;
							aucgbot.msg(serv, "#elf", nick, "makes a toy car.",
								"The toy car is perfectly made and Santa is very happy.",
								nick, "gets 500 points and 300 coins.");
							break;
						case 3:
							this.scores.score[nick] += 50;
							this.scores.coins[nick] += 50;
							this.scores.reputation[nick] += 150;
							aucgbot.msg(serv, "#elf", nick, "makes a teddy bear.",
								"The teddy bear is poorly made and is nearly falling apart.",
								"Santa is not happy.", nick, "gets 50 points and 50 coins.");
							break;
						case 4:
							this.scores.score[nick] += 250;
							this.scores.coins[nick] += 150;
							this.scores.reputation[nick] += 500;
							aucgbot.msg(serv, "#elf", nick, "makes a teddy bear.",
								"The teddy bear is in good condition and is ready to sell.",
								nick, "gets 250 points and 150 coins.");
							break;
					}
				}
				return true;
			case "rules":
				aucgbot.msg(serv, dest, "buy: Buy items to use in the game. - make: Make a toy. - info: Show your current scores.");
				return true;
			case "elfreset":
				if (host.match(aucgbot.prefs.suHosts))
				{	this.initScores();
					aucgbot.log(serv, "ELF RESET", nick + (at ? " in " + dest : ""));
					aucgbot.msg(serv, "#elf", "Variables reset!!!");
				}
				return true;
			case "reloadscores":
				this.loadScores();
				aucgbot.msg(serv, "#elf", "Scores reloaded.");
				return true;
			case "writescores":
				this.saveScores();
				return true;
		}
	}
}