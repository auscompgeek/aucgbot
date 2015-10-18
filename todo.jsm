// -*- Mode: JavaScript; tab-width: 4 -*- vim:tabstop=4 syntax=javascript:
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
/* jshint esnext: true, node: true */

var fs = require("fs");
module.exports.version = 0.92;
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
	if (e.args) {
		list.push(e.args);
		this.saveUsers();
	} else if (!list.length) {
		e.reply("Nothing on your todo list.");
	} else {
		e.reply(list.map((todo, index) => "[{0}] {1}".format(index, todo)).join(" "));
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

		for (var i = 0; i < indexes.length; i++) {
			if (indexes[i] >= list.length) {
				e.reply("Can't delete {0}, you only have {1} todo{2} left.".format(indexes[i], list.length, list.length == 1 ? "" : "s"));
				return true;
			}
			list.splice(indexes[i], 1);
		}

		this.saveUsers();
	} else {
		var filteredList = list.map((s, i) => ({ elem: s, index: i })).filter(todo => todo.elem.startsWith(e.args));

		switch (filteredList.length) {
			case 0:
				e.reply('No todos starting with "{0}".'.format(e.args));
				break;
			case 1:
				list.splice(filteredList[0].index, 1);
				this.saveUsers();
				break;
			default:
				e.reply("Did you mean: {0}".format(filteredList.map(todo => "[{0}] {1}".format(todo.index, todo.elem).join(" "))));
		}
	}
	return true;
};
module.exports.cmd_tododel.help = "Delete an item from your todo list. Usage: tododel <comma separated indices | beginning of todo>";

module.exports.cmd_todoins = function cmd_todoins(e) {
	var match = /^([0-9]+) (.+)$/.exec(e.args);
	if (!match) {
		e.reply(this.cmd_todoins.help);
		return true;
	}
	var list = this.getList(e.nick);
	var index = match[1] >>> 0, todo = match[2];

	if (index >= list.length) {
		e.reply("You only have {0} todo{1}.".format(list.length, list.length == 1 ? "" : "s"));
	} else {
		list.splice(index, 0, todo);
		this.saveUsers();
	}
	return true;
}

module.exports.cmd_todoins.help = "Inserts a todo before the specified index. Usage: todoins <index> <todo>";

try { module.exports.loadUsers(); } catch (ex) {
	console.error("Error while loading todo lists from disk:", ex);
}
