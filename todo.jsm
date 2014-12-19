// -*- Mode: JavaScript; tab-width: 4 -*- vim:tabstop=4 syntax=javascript:
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
/*global module.exports: false */
var fs = require("fs");
module.exports.version = 0.1;
module.exports.users = {};
module.exports.DB_FILENAME = "todo.json";

module.exports.loadUsers = function loadUsers() {
	this.users = JSON.parse(fs.readFileSync(this.DB_FILENAME));
};

module.exports.saveUsers = function saveUsers() {
	fs.writeFileSync(this.DB_FILENAME, JSON.stringify(this.users));
};

module.exports.getList = function getList(nick) {
	var name = nick.replace(/(?!^)(?:\|.*|\d+|_+)$/, "").toLowerCase();
	var users = this.users;
	if (!Object.prototype.hasOwnProperty.call(users, name)) {
		users[name] = [];
	}
	return users[name];
};

module.exports.cmd_todo = function cmd_todo(e) {
	var list = this.getList(e.nick);
	console.log('args: ' + e);
	if (e.args) {
		list.push(e.args);
		this.saveUsers();
		// e.notice("Ok.");
	} else if (!list.length) {
		e.reply("Nothing on your todo list.");
	} else {
		var i = 0;
		e.reply(list.map(function addIndex(todo) {
			return "[{0}] {1}".format(i++, todo);
		}).join(" "));
	}

	return true;
};
module.exports.cmd_todo.help = "Add stuff to your todo list and get the list. Usage: todo [item]";

module.exports.cmd_tododel = function cmd_tododel(e) {
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
			// e.notice("Ok, deleted {0} todo{1}.".format(deleted, deleted == 1 ? "" : "s"));
		}
		if (notdeleted > 0)
			e.reply("You only have {0} todo{1}.".format(list.length, list.length == 1 ? "" : "s"));
	} else {
		var filteredlist = list.filter(function startsWith(s) {
			return s.slice(0, e.args.length) == e.args;
		});

		switch (filteredlist.length) {
			case 0:
				e.reply("No todos starting with \"{0}\".".format(e.args));
				break;
			case 1:
				list.splice(list.indexOf(filteredlist[0]), 1);
				this.saveUsers();
				// e.notice("Ok, deleted \"{0}\".".format(filteredlist[0]));
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

module.cmd_todoins = function cmd_todoins(e) {
	var regex = /^([0-9]+) (.+)$/;
	if (!e.args || ! regex.test(e.args)) {
		e.reply(this.cmd_todoins.help);
		return true;
	}
	var match = regex.exec(e.args);
	var list = this.getList(e.nick);
	var index = Number(match[1]), todo = match[2];

	if (index >= list.length)
		e.reply("You only have {0} todo{1}.".format(list.length, list.length == 1 ? "" : "s"));
	else {
		list.splice(index, 0, todo);
		this.saveUsers();
		// e.notice("Ok.");
	}
	return true;
}

module.cmd_todoins.help = "Inserts a todo before the specified index. Usage: todoins <index> <todo>";

try { module.exports.loadUsers(); } catch (ex) {
	println("Error while loading todo lists from disk: ", ex);
}
