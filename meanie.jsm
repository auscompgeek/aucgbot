// -*- Mode: JavaScript; tab-width: 4 -*- vim:tabstop=4 syntax=javascript:
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
/*jshint expr: true */
/*global module: false, randint: false */

module.version = 0.1;

// Comes up with a random insult. Copyedited from mozbot.
module.cmd_insult = function cmd_insult(dest, args, nick, ident, host, conn, relay) {
	var adjs = ["acidic", "antique", "contemptible", "culturally-unsound",
	"despicable", "evil", "fermented", "festering", "foul", "fulminating", "humid", "impure",
	"inept", "inferior", "industrial", "left-over", "low-quality", "malodorous", "off-color",
	"penguin-molesting", "petrified", "pointy-nosed", "salty", "sausage-snorfling",
	"tasteless", "tempestuous", "tepid", "tofu-nibbling", "unintelligent", "unoriginal",
	"uninspiring", "weasel-smelling", "wretched", "spam-sucking", "egg-sucking",
	"decayed", "halfbaked", "infected", "squishy", "porous", "pickled", "coughed-up", "thick",
	"vapid", "hacked-up", "unmuzzled", "bawdy", "vain", "lumpish", "churlish", "fobbing",
	"rank", "craven", "puking", "jarring", "fly-bitten", "pox-marked", "fen-sucked", "spongy",
	"droning", "gleeking", "warped", "currish", "milk-livered", "surly", "mammering",
	"ill-borne", "beef-witted", "tickle-brained", "half-faced", "headless", "wayward",
	"rump-fed", "onion-eyed", "beslubbering", "villainous", "lewd-minded", "cockered",
	"full-gorged", "rude-snouted", "crook-pated", "pribbling", "dread-bolted", "fool-born",
	"puny", "fawning", "sheep-biting", "dankish", "goatish", "weather-bitten", "knotty-pated",
	"malt-wormy", "saucyspleened", "motley-mind", "it-fowling", "vassal-willed",
	"loggerheaded", "clapper-clawed", "frothy", "ruttish", "clouted", "common-kissing",
	"pignutted", "folly-fallen", "plume-plucked", "flap-mouthed", "swag-bellied",
	"dizzy-eyed", "gorbellied", "weedy", "reeky", "measled", "spur-galled", "mangled",
	"impertinent", "bootless", "toad-spotted", "hasty-witted", "horn-beat", "yeasty",
	"imp-bladdereddle-headed", "boil-brained", "tottering", "hedge-born",
	"hugger-muggered", "elf-skinned", "Microsoft-loving"];

	var amnts = ["accumulation", "bucket", "coagulation", "enema-bucketful",
	"gob", "half-mouthful", "heap", "mass", "mound", "petrification", "pile", "puddle", "stack",
	"thimbleful", "tongueful", "ooze", "quart", "bag", "plate", "ass-full", "assload"];

	var nouns = ["bat toenails", "bug spit", "cat hair", "chicken piss",
	"dog vomit", "dung", "fat woman's stomach-bile", "fish heads",
	"guano", "gunk", "pond scum", "rat retch", "red dye number-9",
	"Sun IPC manuals", "waffle-house grits", "yoo-hoo", "dog balls",
	"seagull puke", "cat bladders", "pus", "urine samples", "squirrel guts",
	"snake assholes", "snake bait", "buzzard gizzards", "cat-hair-balls",
	"rat-farts", "pods", "armadillo snouts", "entrails", "snake snot",
	"eel ooze", "slurpee-backwash", "toxic waste", "Stimpy-drool",
	"poopy", "poop", "craptacular carpet droppings", "jizzum",
	"cold sores", "anal warts", "IE user"];

	//
	// Insults are formed by making combinations of:
	//
	//    You are nothing but a(n) {adj} {amt} of {adj} {noun}
	//
	var count = adjs.length, adj1 = adjs.random(), adj2;
	if (count > 1) {
		var index = randint(0, count);
		if (adjs[index] == adj1) { // musn't be the same as %adj1
			index++;
			if (index >= count)
				index = 0;
		}
		adj2 = adjs[index];
	} else {
		adj2 = "err... of... some";
	}
	var amnt = amnts.random(), noun = nouns.random();
	var an = /^[aeiou]/.test(adj1) ? "an" : "a";
	conn.reply(dest, args || nick, "You are nothing but", an, adj1, amnt, "of", adj2, noun + ".");
	return true;
};

module.cmd_slap = function cmd_slap(dest, args, nick, ident, host, conn, relay) {
	function me(msg) "\x01ACTION " + msg + "\x01";
	var res = [
		me("slaps $nick around a bit with a large trout"),
		me("slaps $nick around a bit with a small fish"),
		"$nick! Look over there! *slap*",
		me("gets the battering hammer and bashes $nick with it"),
		me("bashes $nick with a terrifying Windows ME user guide"),
		me("beats $nick to a pulp"),
		me("whams $nick into auscompgeek's Nokia"),
		me("hits $nick with an enormous Compaq laptop"),
		me("hits $nick with auscompgeek's Lenovo Edge 11 (DER)"),
		me("hits $nick with a breath taking Windows ME user guide"),
		me("smacks $nick"),
		me("trips up $nick and laughs"),
		me("uses his 1337ness against $nick"),
		me("slaps $nick, therefore adding to his aggressiveness stats"),
		me("pokes $nick in the ribs"),
		me("drops a fully grown whale on $nick"),
		me("whacks $nick with a piece of someone's floorboard"),
		me("slaps $nick with IE6"),
		me("trout slaps $nick"),
		me("hits $nick over the head with a hammer"),
		me("slaps $nick"),
		me("slaps $nick with a trout"),
		me("whacks $nick with a suspicious brick"),
		me("puts $nick's fingers in a Chinese finger lock"),
		me("randomly slaps $nick"),
		me("pies $nick"),
		me("eats $nick"),
		me("teabags $nick"),
		me("hits $nick over the head with a 2-by-4"),
		me("drops a bowling bowl on $nick")
	];
	conn.msg(dest, res.random().replace("$nick", args || nick));
	return true;
};
