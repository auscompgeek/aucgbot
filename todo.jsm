// -*- Mode: JavaScript; tab-width: 4 -*- vim:tabstop=4 syntax=javascript:
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
/*global module: false */

module.version = 0.92;
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
		// e.notice("Ok.");
	} else if (!list.length) {
		e.reply("Nothing on your todo list.");
	} else {
		e.reply(list.map(function addIndex(todo, index) {
			return "[{0}] {1}".format(index, todo);
		}).join(" "));
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

		var notDeleted = 0;
		for (var i = 0; i < indexes.length; i++) {
			if (indexes[i] >= list.length) {
				notDeleted++;
			}
			else {
				list.splice(indexes[i], 1);
			}
		}

		var deleted = indexes.length - notDeleted;
		if (deleted != 0) {
			this.saveUsers();
			// e.notice("Ok, deleted {0} todo{1}.".format(deleted, deleted == 1 ? "" : "s"));
		}
		if (notDeleted > 0) {
			e.reply("You only have {0} todo{1}.".format(list.length, list.length == 1 ? "" : "s"));
		}
	} else {
		var filteredList = list.map(function (s, i) {
			return {
				elem: s,
				index: i
			};
		}).filter(function (todo) {
			return todo.elem.startsWith(e.args);
		});

		switch (filteredList.length) {
			case 0:
				e.reply('No todos starting with "{0}".'.format(e.args));
				break;
			case 1:
				list.splice(list.indexOf(filteredList[0].elem), 1);
				this.saveUsers();
				// e.notice("Ok, deleted \"{0}\".".format(filteredList[0].elem));
				break;
			default:
				e.reply("Did you mean: {0}".format(filteredList.map(function (todo) {
					return "[{0}] {1}".format(todo.index, todo.elem);
				}).join(" ")));
		}
	}
	return true;
};
module.cmd_tododel.help = "Delete an item from your todo list. Usage: tododel <comma separated indexes | beginning of todo>";

module.cmd_todoins = function cmd_todoins(e) {
	var match = /^([0-9]+) (.+)$/.exec(e.args);
	if (match === null) {
		e.reply(this.cmd_todoins.help);
		return true;
	}
	var list = this.getList(e.nick);
	var index = match[1] >>> 0, todo = match[2];

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

try { module.loadUsers(); } catch (ex) {
	println("Error while loading todo lists from disk: ", ex);
}
