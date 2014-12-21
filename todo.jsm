// -*- Mode: JavaScript; tab-width: 4 -*- vim:tabstop=4 syntax=javascript:
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
/*global module: false */

module.version = 0.8;
module.users = {};
module.DB_FILENAME = "todo.json";

module.loadUsers = function loadUsers() {
	this.users = JSON.parse(aucgbot.readURI(this.DB_FILENAME));
};

module.saveUsers = function saveUsers() {
	var file = new Stream(this.DB_FILENAME, "w");
	file.write(JSON.stringify(this.users));
	file.close();
};

module.getList = function getList(nick) {
	var name = nick.replace(/(?!^)(?:\|.*|\d+|_+)$/, "").toLowerCase();
	var users = this.users;
	if (!Object.prototype.hasOwnProperty.call(users, name)) {
		users[name] = [];
	}
	return users[name];
};

module.cmd_todo = function cmd_todo(e) {
	var list = this.getList(e.nick);

	if (e.args) {
		list.push(e.args);
		this.saveUsers();
		e.notice("Ok.");
	} else if (!list.length) {
		e.reply("Nothing on your todo list.");
	} else {
		var i = 0;
		e.reply(list.map(function addIndex(todo) {
			return "[{0}] {1}".format(i++, todo);
		}).join("; "));
	}

	return true;
};
module.cmd_todo.help = "Add stuff to your todo list and get the list. Usage: todo [item]";

module.cmd_tododel = function cmd_tododel(e) {
	if (!e.args) {
		e.reply(this.cmd_tododel.help);
		return true;
	}

	var list = this.getList(e.nick);

	if (/^[0-9,]+$/.test(e.args)) {
		var indexes = e.args.split(",").map(Number);

		var notdeleted = 0;
		for (var i = 0; i < indexes.length; i++) {
			if (indexes[i] >= list.length)
				notdeleted++;
			else
				list.splice(indexes[i], 1);
		}

		var deleted = indexes.length - notdeleted;
		if (deleted != 0) {
			this.saveUsers();
			e.notice("Ok, deleted {0} todo{1}.".format(deleted, deleted == 1 ? "" : "s"));
		}
		if (notdeleted > 0)
			e.reply("{0} todo{1}n't deleted. You only have {2} todo{3} on your todo list.".format(
				notdeleted, notdeleted == 1 ? " was" : "s were", list.length, list.length == 1 ? "" : "s"));
	} else {
		var filteredlist = list.filter(function startsWith(s) {
			return s.slice(0, e.args.length) == e.args;
		});

		switch (filteredlist.length) {
			case 0:
				e.reply("No todos found starting with \"{0}\".".format(e.args));
				break;
			case 1:
				list.splice(list.indexOf(filteredlist[0]), 1);
				this.saveUsers();
				e.notice("Ok, deleted \"{0}\".".format(filteredlist[0]));
				break;
			default:
				var formattedlist = [], currentindex = 0;
				// O(list.length) way of finding these. No indexOf found here.
				for (var i = 0; i < list.length; i++) {
					if (list[i] == filteredlist[currentindex]) {
						formattedlist[currentindex] = "[{0}] {1}".format(i, filteredlist[currentindex]);
						currentindex++;
					}
				}
				e.reply("Did you mean: {0}".format(formattedlist.join("; ")));
		}
	}
	return true;
};
module.cmd_tododel.help = "Delete an item from your todo list. Usage: tododel [<index> | <startswith>]";

try { module.loadUsers(); } catch (ex) {
	println("Error while loading todo lists from disk: ", ex);
}
