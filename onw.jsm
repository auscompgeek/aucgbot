"use strict";
(function (self) {

self.version = 0.5;

const NOT_STARTED = 0;
const NIGHT = 1;
const DAY = 2;
const VOTING = 3;

const CENTRE_POSITIONS = ["left", "middle", "right"];
const centreNameToIndex = CENTRE_POSITIONS.indexOf.bind(CENTRE_POSITIONS);

self.WOLF_ROLES = ["werewolf", "minion"];
self.VILLAGE_ROLES = ["mason", "seer", "robber", "troublemaker", "drunk", "insomniac", "hunter", "villager"];
self.TARGETING_ROLES = ["seer", "robber", "troublemaker", "drunk"];
self.ROLES = self.WOLF_ROLES.concat(self.VILLAGE_ROLES, "tanner");  // roles in night action order

self.IN_PM_ONLY_CMDS = ["see", "swap", "vote"];
self.NOT_PLAYING_CMDS = ["join", "stats", "fstop"];

self.ROLE_PMS = {
	"werewolf": "You are a werewolf. Your goal is to survive.",
	"minion": "You are a minion. You are trying to help the werewolves take over the town. Your goal is to avoid getting the werewolves killed. You win with the werewolves.",
	"mason": "You are a mason.",
	"seer": "You are the seer. You may either see someone else's initial role using `onw see <player>`, or look at two roles in the centre using `onw see (left|middle|right) (left|middle|right)`.",
	"robber": "You are the robber. You may rob a player's role by using the `onw swap <player>` command. You will see your new role.",
	"troublemaker": "You are the troublemaker. You may swap two players' roles, not including yourself, using the `onw swap <player1> <player2>` command.",
	"drunk": "You are the drunk. You must swap your role with a role in the centre, using the `onw swap (left|middle|right)` command. You will not see your new role.",
	"insomniac": "You are the insomniac. At the end of the night, you will see your new role.",
	"hunter": "You are the hunter. If you are killed, you will kill whoever you vote for.",
	"villager": "You are a regular villager.",
	"tanner": "You are the tanner. Your goal is to get killed.",
};

self.server = "im.codemonkey.be:+6697";
self.channel = "#botcentral";
self.useCnotice = false;
self.allowSelfVote = false;

self.players = [];
self.state = NOT_STARTED;

self.cmd_onw = function cmd_onw(e) {
	if (e.conn.addr !== self.server) {
		e.nreply("Wrong network mate, sorry.");
		return true;
	}

	let args = e.args;
	if (!args) {
		e.nreply(cmd_onw.help);
		return true;
	}

	let argv = e.args.split(" ");
	let cmd = argv.shift();

	if (!(self.NOT_PLAYING_CMDS.includes(cmd) || self.players.includes(e.nick))) {
		e.notice("You're not playing.");
	} else if (e.dest !== e.nick && self.IN_PM_ONLY_CMDS.includes(cmd)) {
		e.notice("Do this in PM, silly duffer.");
	} else if (self.subcommands.hasOwnProperty(cmd)) {
		self.subcommands[cmd](e, argv);
	} else {
		e.nreply("Unknown subcommand.", cmd_onw.help);
	}

	return true;
};
self.cmd_onw.help = "One Night Ultimate Werewolf. Subcommands: join, stats, start, vote, see, swap";

self.subcommands = {
	join: function (e, argv) {
		if (e.dest !== self.channel) {
			e.nreply("Please use this command in the designated channel.");
			return;
		}

		if (self.state !== NOT_STARTED) {
			e.notice("Sorry, the game has already started.");
			return;
		}

		let nick = e.nick;
		let players = self.players;

		if (!players.includes(nick)) {
			players.push(nick);
			e.send(nick, "has joined the game of One Night Ultimate Werewolf.");
		} else {
			e.notice("You're already in the game!");
		}
	},
	leave: function (e, argv) {
		if (self.state !== NOT_STARTED) {
			e.notice("Sorry, the game has already started, and leaving during a game is not implemented.");
			return;
		}

		let nick = e.nick;
		let players = self.players;
		let index = players.indexOf(nick);
		players.splice(index, 1);

		e.conn.msg(self.channel, nick, "was mauled by wild animals and has died.");
	},
	stats: function (e, argv) {
		let players = self.players;
		e.nreply(players.length, "players:", players.join(", "));
		if (self.roles) {
			e.nreply("Roles:", self.roles.join(", "));
		}
	},
	start: function start(e, argv) {
		if (!e.isSU()) {
			e.nreply("Only bot admins can use the start command currently, sorry.");
			return;
		}

		switch (self.state) {
		case NOT_STARTED:
			let numPlayers = self.players.length, numRoles = argv.length;
			if (!numPlayers) {
				e.nreply("There aren't any players to start a game.");
			} else if (numRoles === numPlayers + 3) {
				self.startGame(e, argv);
			} else if (numRoles) {
				e.nreply("There are", numPlayers, "players, and you have specified", numRoles, "roles. I need precisely 3 more roles than players.");
			} else {
				e.nreply("Gimme roles.");
			}
			break;

		case DAY:
			if (argv[0] === "voting") {
				self.startVotePhase(e.conn);
			} else {
				e.nreply("Did you mean: start voting?");
			}
			break;

		default:
			e.notice("You can't start anything at this point of time.");
		}
	},
	fstop: function fstop(e, argv) {
		if (!e.isSU()) {
			e.nreply("Only bot admins can force stop the game.");
			return;
		}

		self.clean();
		e.conn.msg(self.channel, "The game of One Night Werewolf has been force stopped.");
	},
	vote: function vote(e, argv) {
		if (self.state !== VOTING) {
			e.notice("Voting hasn't started yet.");
			return;
		}

		let voter = e.nick, votee = argv[0];

		if (!votee) {
			e.notice("Who do you want to vote for?");
		} else if (!self.allowSelfVote && voter == votee) {
			e.notice("You may not vote for yourself.");
		} else if (self.players.includes(votee)) {
			self.votes.set(voter, votee);
			e.notice(`You are now voting for ${votee}.`);
			self.checkVotes(e.conn);
		} else {
			e.notice("That person isn't playing.");
		}
	},
	see: function see(e, argv) {
		if (self.state !== NIGHT) {
			e.notice("This action can only be performed during the night.");
			return;
		}

		let player = e.nick;
		if (self.targets.has(player)) {
			e.notice("You have already picked a target.");
			return;
		}

		let target = argv[0];
		if (!target) {
			e.notice("You kinda need a target to do that.");
			return;
		}

		// note: we return werewolf and seer results immediately, for simplicity.
		// we just store the targets to keep track of who has submitted actions.
		switch (self.playerToRole[player]) {
		case "seer":
			const INVALID_SEER_ARGS = "Please provide two valid centre positions (left, middle, right) or a player name.";
			if (argv.length === 2) {
				let indexA = centreNameToIndex(argv[0]), indexB = centreNameToIndex(argv[1]);
				if (indexA === -1 || indexB === -1 || indexA === indexB) {
					e.notice(INVALID_SEER_ARGS);
					return;
				}

				self.targets.set(player, [indexA, indexB]);
				e.notice(`With your divine powers, you see that the ${self.centreRoles[indexA]} and ${self.centreRoles[indexB]} are missing from the town!`);
			} else if (target === player) {
				e.notice("Don't be silly, you already know what your role is.");
			} else if (self.players.includes(target)) {
				self.targets.set(player, target);
				e.notice(`With your divine powers, you see that ${target} is a ${self.playerToRole[target]}.`);
			} else {
				e.notice("That person is not playing.", INVALID_SEER_ARGS);
			}
			break;

		case "werewolf":
			if (self.roleToPlayers.werewolf.length !== 1) {
				e.notice("You are not the only werewolf.");
				return;
			}
			target = CENTRE_POSITIONS.indexOf(target);
			if (target !== -1) {
				self.targets.set(player, target);
				e.notice(`You look at one of the missing roles, and see a ${self.centreRoles[target]}.`);
			} else {
				e.notice(target, "is not a valid centre position (left, middle, right).");
			}
			break;

		default:
			e.notice("You do not have a seeing role.");
			return;
		}

		self.checkNightEnd(e.conn);
	},
	swap: function swap(e, argv) {
		if (self.state !== NIGHT) {
			e.notice("This action can only be performed during the night.");
			return;
		}

		let player = e.nick;
		if (self.targets.has(player)) {
			e.notice("You have already picked a target.");
			return;
		}

		let target = argv[0];
		if (!target) {
			e.notice("You kinda need a target to do that.");
			return;
		}

		switch (self.playerToRole[player]) {
		case "robber":
			if (self.players.includes(target)) {
				self.targets.set(player, target);
				e.notice("You have picked", target, "to rob.");
			} else {
				e.notice(target, "is not playing.");
			}
			break;

		case "troublemaker":
			if (!self.players.includes(target)) {
				e.notice(target, "is not playing.");
				return;
			}

			let targetB = argv[1];
			if (!self.players.includes(targetB)) {
				e.notice(targetB, "is not playing.");
				return;
			}

			if (target === player || targetB === player) {
				e.notice("You may not swap a player with yourself.");
				return;
			}

			self.targets.set(player, [target, targetB]);
			e.notice("You have picked", target, "and", targetB, "to swap.");
			break;

		case "drunk":
			target = centreNameToIndex(target);
			if (target !== -1) {
				self.targets.set(player, target);
				e.notice("You have picked the", CENTRE_POSITIONS[target], "role to swap with.");
			} else {
				e.notice("That is not a valid centre position (left, middle, right).");
			}
			break;

		default:
			e.notice("You do not have a swapping role.");
			return;
		}

		self.checkNightEnd(e.conn);
	},
};

self.findInvalidRole = function findInvalidRole(roles) {
	for (let role of roles) {
		if (!self.ROLES.includes(role)) {
			return role;
		}
	}
};

self.startGame = function startGame(e, roles) {
	{
		let role = self.findInvalidRole(roles);
		if (role) {
			e.nreply(role, "is not a valid role.");
			return;
		}
	}

	let conn = e.conn;

	self.roles = roles;
	roles = Array.from(roles);  // copy the array
	shuffleArray(roles);

	self.centreRoles = [roles.pop(), roles.pop(), roles.pop()];
	let roleToPlayers = self.roleToPlayers = {};  // role: array of players (string)
	let roleToNewPlayers = self.roleToNewPlayers = {}; // role: set of players
	let playerToRole = self.playerToRole = {};  // player: role (string)
	let playerToNewRole = self.playerToNewRole = {};
	self.targets = new Map();  // player: centre index (number)/player/array of players (string) or centre indices

	self.numTargetingRoles = 0;
	for (let role of roles) {
		if (self.TARGETING_ROLES.includes(role)) {
			self.numTargetingRoles++;
		}
	}

	let players = self.players;
	for (let i = 0; i < players.length; i++) {
		let player = players[i], role = roles[i];
		playerToRole[player] = playerToNewRole[player] = role;

		if (roleToPlayers[role]) {
			roleToPlayers[role].push(player);
			roleToNewPlayers[role].add(player);
		} else {
			roleToNewPlayers[role] = new Set(roleToPlayers[role] = [player]);
		}
	}

	self.state = NIGHT;

	self.sendRoles(conn);
	self.doMasonry(conn);

	setTimeout(() => conn.msg(self.channel, "Welcome to the game of One Night Ultimate Werewolf. Players, please check your PMs for your role and any instructions."), 1000);
};

self.sendRoles = function sendRoles(conn) {
	for (let role of self.ROLES) {
		let rolePlayers = self.roleToPlayers[role];
		if (rolePlayers) {
			cnotice(conn, rolePlayers.join(","), self.ROLE_PMS[role]);
		}
	}
};

self.doMasonry = function doMasonry(conn) {
	// wolves
	let wolves = self.roleToPlayers.werewolf;
	let minions = self.roleToPlayers.minion;

	if (wolves && wolves.length) {
		if (wolves.length !== 1) {
			let targets = Array.from(wolves);
			if (minions) {
				targets.push(...minions);
			}
			cnotice(conn, targets.join(","), "Wolves:", wolves.join(", "));

		} else {
			// lone wolf
			let wolf = wolves[0];
			cnotice(conn, wolf, "You are the only wolf. You may look at a role in the centre using the `onw see (left|middle|right)` command.");
			self.numTargetingRoles++;

			if (minions && minions.length) {
				cnotice(conn, minions.join(","), "There is one wolf:", wolf);
			}
		}
	} else if (minions && minions.length) {
		cnotice(conn, minions.join(","), "There are no wolves. You become a werewolf. Your goal is to survive.");
	}

	// masons
	let masons = self.roleToPlayers.mason;
	if (masons && masons.length) {
		if (masons.length !== 1) {
			cnotice(conn, masons.join(","), "Masons:", masons.join(", "));
		} else {
			cnotice(conn, masons[0], "You are the only mason.");
		}
	}
};

self.setNewRole = function setNewRole(player, role) {
	let currentRole = self.playerToNewRole[player];
	if (currentRole === role) return;

	let currRolePlayers = self.roleToNewPlayers[currentRole];
	currRolePlayers.delete(player);
	if (!currRolePlayers.size) {
		delete self.roleToNewPlayers[currentRole];
	}

	self.playerToNewRole[player] = role;
	if (self.roleToNewPlayers[role]) {
		self.roleToNewPlayers[role].add(player);
	} else {
		self.roleToNewPlayers[role] = new Set([player]);
	}
};

self.swapPlayerRoles = function swapPlayerRoles(playerA, playerB) {
	let roleA = self.playerToNewRole[playerA];
	let roleB = self.playerToNewRole[playerB];
	self.setNewRole(playerA, roleB);
	self.setNewRole(playerB, roleA);
};

self.swapPlayerCentre = function swapPlayerCentre(player, pos) {
	let playerRole = self.playerToNewRole[player];
	let centreRole = self.centreRoles[pos];
	self.setNewRole(player, centreRole);
	self.centreRoles[pos] = playerRole;
};

self.checkNightEnd = function checkNightEnd(conn) {
	if (self.targets.size === self.numTargetingRoles) {
		self.endNight(conn);
	}
};

self.roleNightActions = {
	// werewolf/seer actions are handled immediately when we receive the command
	// so no need to handle them here.

	robber: function (conn, robbers) {
		for (let player of robbers) {
			let target = self.targets.get(player);
			if (target === player) continue;
			self.swapPlayerRoles(player, target);
			cnotice(conn, player, `You are now a ${self.playerToNewRole[player]}.`);
		}
	},

	troublemaker: function (conn, troublemakers) {
		for (let player of troublemakers) {
			let targets = self.targets.get(player);
			self.swapPlayerRoles(targets[0], targets[1]);
		}
	},

	drunk: function (conn, drunks) {
		for (let player of drunks) {
			let target = self.targets.get(player);
			self.swapPlayerCentre(player, target);
		}
	},

	insomniac: function (conn, insomniacs) {
		for (let player of insomniacs) {
			cnotice(conn, player, `You are now a ${self.playerToNewRole[player]}.`);
		}
	},
};

self.endNight = function endNight(conn) {
	for (let role of self.ROLES) {
		if (typeof self.roleNightActions[role] === "function" && self.roleToPlayers[role]) {
			self.roleNightActions[role](conn, self.roleToPlayers[role]);
		}
	} 

	self.state = DAY;
	conn.msg(self.channel, "Night has ended. BEGIN DAY.");
};

self.startVotePhase = function startVotePhase(conn) {
	self.votes = new Map();
	self.state = VOTING;
	conn.msg(self.channel, "Ok everyone, send in your votes via PM to me. Use the `onw vote` command to vote.");
};

self.checkVotes = function checkVotes(conn) {
	if (self.votes.size === self.players.length) {
		self.endGame(conn);
	}
};

self.endGame = function endGame(conn) {
	let killed = self.countVotes();
	let werewolfRole = self.roleToNewPlayers.werewolf ? "werewolf" : "minion";
	let werewolves = self.roleToNewPlayers[werewolfRole];

	if (killed) {
		let rolesKilled = new Set();
		let townKills = [];
		let hunterKills = [];

		for (let ded of killed) {
			let role = self.playerToNewRole[ded];
			townKills.push(`${ded} (${role})`);
			rolesKilled.add(role);

			if (role === "hunter") {
				let target = self.targets[ded];
				let targetRole = self.playerToNewRole[target];
				hunterKills.push(`${ded} => ${target} (${targetRole})`);
				rolesKilled.add(targetRole);
			}
		}

		conn.msg(self.channel, "The town kills:", townKills.join(", "));
		if (hunterKills.length) {
			conn.msg(self.channel, "Hunter kills:", hunterKills.join(", "));
		}

		if (werewolves && !rolesKilled.has(werewolfRole)) {
			conn.msg(self.channel, "The werewolves survive!", Array.from(werewolves).join(", "));
		}
	} else if (!werewolves) {
		conn.msg(self.channel, "The town decides to kill nobody. There are no werewolves; the villagers win!");
	} else {
		conn.msg(self.channel, "The town decides to kill nobody. The werewolves survive!", Array.from(werewolves).join(", "));
	}

	console.log(self.votes);
	console.log(self.roleToNewPlayers);
	self.clean();
};

// thx @Venergon xoxo
self.countVotes = function countVotes() {
	let votes = new Map();
	for (let votee of self.votes.values()) {
		if (votes.has(votee)) {
			// hello again Java
			votes.set(votee, votes.get(votee) + 1);
		} else {
			votes.set(votee, 1);
		}
	}

	let max = 0;
	let killed = [];
	for (let entry of votes) {
		let votee = entry[0];
		let num = entry[1];

		if (num > max) {
			killed = [votee];
			max = num;
		} else {
			killed.push(votee);
		}
	}

	if (max === 1) {
		killed = null;
	}

	return killed;
};

self.clean = function clean() {
	for (let i of ["votes", "roles", "roleToPlayers", "roleToNewPlayers", "playerToRole", "playerToNewRole"]) {
		delete self[i];
	}
	self.players = [];
	self.state = NOT_STARTED;
};

function cnotice(conn, targets, ...msg) {
	if (self.useCnotice) {
		conn.writeln("CNOTICE ", self.channel, " ", targets, " :", msg.join(" "));
	} else {
		conn.notice(targets, msg.join(" "));
	}
}

})(exports);

// Get a random integer in the range [0,n).
function randomBelow(n) {
	return Math.floor(Math.random() * n);
}

// Shuffle an array in-place.
function shuffleArray(a) {
	for (let i = a.length - 1; i > 0; i--) {
		// Pick an element up to i (inclusive) with which to swap with i.
		let j = randomBelow(i + 1);
		let tmp = a[i]; a[i] = a[j]; a[j] = tmp;
	}
}

// vim:tabstop=4 shiftwidth=4 filetype=javascript:
