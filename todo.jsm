// -*- Mode: JavaScript; tab-width: 4 -*- vim:tabstop=4 syntax=javascript:
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
/*global module.exports: false */
var fs = require("fs");
module.exports.version = 0.5;
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
		e.notice("Ok.");
	} else if (!list.length) {
		e.reply("Nothing on your todo list.");
	} else {
		e.reply(list.join("; "));
	}

	return true;
};
module.exports.cmd_todo.help = "Add stuff to your todo list and get the list. Usage: todo [item]";

module.exports.cmd_tododel = function cmd_tododel(e) {
	if (!e.args) {
		e.reply(this.cmd_tododel.help);
		return true;
	}
	var index = e.args >>> 0;

	var list = this.getList(e.nick);

	if (index >= list.length) {
		e.reply("You only have {0} things in your todo list.".format(list.length));
	} else {
		list.splice(index, 1);
		e.notice("Ok.");
	}

	return true;
};
module.exports.cmd_tododel.help = "Delete an item from your todo list. Usage: tododel <index>";

try { module.exports.loadUsers(); } catch (ex) {
	println("Error while loading todo lists from disk: ", ex);
}
