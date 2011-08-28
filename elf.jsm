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
 *   iYorkie, email pending, mIRC script author
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

module.version = "1.0.1 (28 Apr 2011)";
module.prefix = "%";
module.score = {}, module.coins = {}, module.materials = {}, module.reputation = {}, module.total = {};
run("elfscores.js");
module.parseln =
function parseln(ln, serv)
{	if (/^:(\S+)!\S+@\S+ JOIN :#elf\r/.test(ln) && RegExp.$1 != aucgbot.nick)
	{	nick = RegExp.$1;
		if (this.score[nick])
			aucgbot.send("PRIVMSG #elf :Welcome", nick + ". You have",
				this.score[nick], "points,", this.coins[nick], "coins and",
				this.materials[nick], "materials.");
		else
		{	aucgbot.send("PRIVMSG #elf :Hey. Looks like you are new!",
				"You have been given 5 free materials to get you started.");
			this.coins[nick] = this.reputation[nick] = this.total[nick] = 0;
			this.score[nick] = 1;
			this.materials[nick] = 5;
			aucgbot.send("NOTICE", nick,
				":[#elf] Hey! It looks like you are a new user. Type",
				this.prefix + "rules for more info on the game.",
				"Start by making some toys using", this.prefix + "make.");
		}
		return true;
	}
}
module.onMsg =
function onMsg(dest, msg, nick, host, at, serv)
{	if (msg.substr(0, this.prefix.length) == this.prefix) // Starts with prefix.
	{	msg = msg.substr(this.prefix.length).toLowerCase().split(" ");
		switch (msg[0])
		{	case "info":
				nick = msg[1] || nick;
				aucgbot.send("PRIVMSG", dest, ":" + nick + ":",
					this.score[nick], "points,", this.materials[nick], "materials,",
					this.coins[nick], "coins,", "Reputation:", this.reputation[nick] +
					", made", this.total[nick], "toys.");
				return true;
			case "buy":
				switch (msg[1])
				{	case "material":
						s = (msg[2] || 1) * 2;
						if (this.coins[nick] >= s)
						{	this.coins[nick] -= s;
							this.materials[nick]++;
							aucgbot.send("PRIVMSG #elf :" + nick, "has bought",
								msg[2], "materials. This has cost", s, "in total.");
							break;
						}
					case "voice":
						if (this.coins[nick] >= 800)
						{	this.coins[nick] -= 800;
							//aucgbot.send("CS VOP #elf ADD", nick);
							aucgbot.send("CS ACCESS #elf ADD", nick, "VOP");
							aucgbot.send("MODE #elf +v", nick);
							break;
						}
					case "hop":
						if (this.coins[nick] >= 7500)
						{	this.coins[nick] -= 7500;
							//aucgbot.send("CS HOP #elf ADD", nick);
							aucgbot.send("CS ACCESS #elf ADD", nick, "HOP");
							aucgbot.send("MODE #elf +vh", nick, nick);
							break;
						}
					case "op":
						if (this.coins[nick] >= 20000)
						{	this.coins[nick] -= 20000;
							//aucgbot.send("CS AOP #elf ADD", nick);
							aucgbot.send("CS ACCESS #elf ADD", nick, "AOP");
							aucgbot.send("MODE #elf +o", nick);
							break;
						}
					default:
						aucgbot.send("PRIVMSG", dest, ":material <amount>: costs twice the amount, so if you bought 4, you would pay 8 coins.");
						aucgbot.send("PRIVMSG", dest, ":voice: costs 800 coins. | hop: costs 7500 coins. | op: costs 20000 coins.");
						aucgbot.send("PRIVMSG", dest, ":" + nick, "currently has", this.coins[nick], "coins.");
				}
				return true;
			case "make":
				if (this.materials[nick] < 1)
					aucgbot.send("NOTICE", nick, ":You don't have enough materials to make a toy.");
				else
				{	this.materials[nick]--;
					this.total[nick]++;
					switch (ranint(1, 4))
					{	case 1:
							this.score[nick] += 100;
							this.coins[nick] += 150;
							this.reputation[nick] += 250;
							aucgbot.send("PRIVMSG #elf :" + nick, "makes a toy car.",
								"The toy car is fine but is a little scratched.",
								nick, "gets 100 points and 150 coins.");
							break;
						case 2:
							this.score[nick] += 500;
							this.coins[nick] += 300;
							this.reputation[nick] += 750;
							aucgbot.send("PRIVMSG #elf :" + nick, "makes a toy car.",
								"The toy car is perfectly made and Santa is very happy.",
								nick, "gets 500 points and 300 coins.");
							break;
						case 3:
							this.score[nick] += 50;
							this.coins[nick] += 50;
							this.reputation[nick] += 150;
							aucgbot.send("PRIVMSG #elf :" + nick, "makes a teddy bear.",
								"The teddy bear is poorly made and is nearly falling apart.",
								"Santa is not happy.", nick, "gets 50 points and 50 coins.");
							break;
						case 4:
							this.score[nick] += 250;
							this.coins[nick] += 150;
							this.reputation[nick] += 500;
							aucgbot.send("PRIVMSG #elf :" + nick, "makes a teddy bear.",
								"The teddy bear is in good condition and is ready to sell.",
								nick, "gets 250 points and 150 coins.");
							break;
					}
				}
				return true;
			case "rules":
				aucgbot.send("PRIVMSG", dest, ":buy: Buy items to use in the game. | make: Make a toy. | info: Show your current scores.");
				return true;
			case "elfreset":
				if (aucgbot.prefs.suHosts.test(host))
				{	this.score = {}, this.coins = {}, this.materials = {}, this.reputation = {}, this.total = {};
					aucgbot.log(serv, "ELF RESET", nick + (at ? " in " + dest : ""));
					aucgbot.send("PRIVMSG #elf :Variables reset!!!");
				}
				return true;
			case "writescores":
				file = new Stream("file://" + system.cwd.replace(/\\/g, "/") + "/elfscores.js", "w");
				file.write("module.score=", uneval(this.score), ";module.coins=", uneval(this.coins),
					";module.materials=", uneval(this.materials), ";module.total=", uneval(this.total),
					";module.reputation=", uneval(this.reputation));
				file.close();
				return true;
		}
	}
}
