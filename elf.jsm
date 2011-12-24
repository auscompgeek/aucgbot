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
 * The Original Code is JS IRC Elf Bot.
 *
 * The Initial Developer of the Original Code is
 * iYorkie.
 * Portions created by the Initial Developer are Copyright (C) 2010
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   iYorkie, iyorkie@geekbouncer.co.uk, mIRC script author
 *   David Vo, David.Vo2@gmail.com, JS rewriter
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

module.version = "1.1 (5 Dec 2011)";
module.prefix = "$";

function initScores()
{	module.scores = { score: {}, coins: {}, materials: {}, reputation: {}, total: {} };
	println("[ELF] Initialised scores database.");
}
initScores();
function loadScores()
{	try
	{	var file = new Stream("elfscores.json");
		module.scores = JSON.parse(file.readln());
		file.close();
	} catch (ex) {}
}
loadScores();
function saveScores()
{	var file = new Stream("elfscores.json", "w");
	file.write(JSON.stringify(module.scores));
	file.close();
}

module.parseln =
function parseln(ln, serv)
{	if (/^:(\S+)!\S+@\S+ JOIN :#elf\r/.test(ln) && RegExp.$1 != aucgbot.nick)
	{	nick = RegExp.$1;
		if (this.scores.score[nick])
			aucgbot.msg("#elf", "Welcome back", nick + ". You have",
				this.scores.score[nick], "points,", this.scores.coins[nick], "coins and",
				this.scores.materials[nick], "materials.");
		else
		{	this.scores.coins[nick] = this.scores.reputation[nick] = this.scores.total[nick] = 0;
			this.scores.score[nick] = 1;
			this.scores.materials[nick] = 5;
			aucgbot.send("NOTICE", nick,
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
	{	msg = msg.substr(this.prefix.length).toLowerCase().split(" ");
		switch (msg[0])
		{	case "info":
				nick = msg[1] || nick;
				aucgbot.msg(dest, nick + ":",
					this.scores.score[nick], "points,", this.scores.materials[nick], "materials,",
					this.scores.coins[nick], "coins,", "Reputation:", this.scores.reputation[nick] +
					", made", this.scores.total[nick], "toys.");
				return true;
			case "buy":
				switch (msg[1])
				{	case "material":
						s = (msg[2] || 1) * 2;
						if (this.scores.coins[nick] >= s)
						{	this.scores.coins[nick] -= s;
							this.scores.materials[nick]++;
							aucgbot.msg("#elf", nick, "has bought", msg[2],
								"materials. This has cost", s, "in total.");
							break;
						}
					case "voice":
						if (this.scores.coins[nick] >= 800)
						{	this.scores.coins[nick] -= 800;
							//aucgbot.send("CS VOP #elf ADD", nick);
							aucgbot.send("CS ACCESS #elf ADD", nick, "VOP");
							aucgbot.send("MODE #elf +v", nick);
							break;
						}
					case "hop":
						if (this.scores.coins[nick] >= 7500)
						{	this.scores.coins[nick] -= 7500;
							//aucgbot.send("CS HOP #elf ADD", nick);
							aucgbot.send("CS ACCESS #elf ADD", nick, "HOP");
							aucgbot.send("MODE #elf +vh", nick, nick);
							break;
						}
					case "op":
						if (this.scores.coins[nick] >= 20000)
						{	this.scores.coins[nick] -= 20000;
							//aucgbot.send("CS AOP #elf ADD", nick);
							aucgbot.send("CS ACCESS #elf ADD", nick, "AOP");
							aucgbot.send("MODE #elf +ohv", nick, nick, nick);
							break;
						}
					default:
						aucgbot.msg(dest, "material <amount>: costs twice the amount, so if you bought 4, you would pay 8 coins.");
						aucgbot.msg(dest, "voice: costs 800 coins. | hop: costs 7500 coins. | op: costs 20000 coins.");
						aucgbot.msg(dest, nick, "currently has", this.scores.coins[nick], "coins.");
				}
				saveScores();
				return true;
			case "make":
				if (this.scores.materials[nick] < 1)
					aucgbot.send("NOTICE", nick, ":You don't have enough materials to make a toy.");
				else
				{	this.scores.materials[nick]--;
					this.scores.total[nick]++;
					switch (ranint(1, 4))
					{	case 1:
							this.scores.score[nick] += 100;
							this.scores.coins[nick] += 150;
							this.scores.reputation[nick] += 250;
							aucgbot.msg("#elf", nick, "makes a toy car.",
								"The toy car is fine but is a little scratched.",
								nick, "gets 100 points and 150 coins.");
							break;
						case 2:
							this.scores.score[nick] += 500;
							this.scores.coins[nick] += 300;
							this.scores.reputation[nick] += 750;
							aucgbot.msg("#elf", nick, "makes a toy car.",
								"The toy car is perfectly made and Santa is very happy.",
								nick, "gets 500 points and 300 coins.");
							break;
						case 3:
							this.scores.score[nick] += 50;
							this.scores.coins[nick] += 50;
							this.scores.reputation[nick] += 150;
							aucgbot.msg("#elf", nick, "makes a teddy bear.",
								"The teddy bear is poorly made and is nearly falling apart.",
								"Santa is not happy.", nick, "gets 50 points and 50 coins.");
							break;
						case 4:
							this.scores.score[nick] += 250;
							this.scores.coins[nick] += 150;
							this.scores.reputation[nick] += 500;
							aucgbot.msg("#elf", nick, "makes a teddy bear.",
								"The teddy bear is in good condition and is ready to sell.",
								nick, "gets 250 points and 150 coins.");
							break;
					}
				}
				return true;
			case "rules":
				aucgbot.msg(dest, "buy: Buy items to use in the game. | make: Make a toy. | info: Show your current scores.");
				return true;
			case "elfreset":
				if (aucgbot.prefs.suHosts.test(host))
				{	initScores();
					aucgbot.log(serv, "ELF RESET", nick + (at ? " in " + dest : ""));
					aucgbot.msg("#elf", "Variables reset!!!");
				}
				return true;
			case "reloadscores":
				loadScores();
				aucgbot.msg("#elf", "Scores reloaded.");
				return true;
			case "writescores":
				saveScores();
				return true;
		}
	}
}