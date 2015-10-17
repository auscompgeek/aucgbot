// -*- Mode: JavaScript; tab-width: 4 -*- vim:tabstop=4:
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
/* jshint eqnull: true */
"use strict";
if (typeof global.randint !== "function")
/**
 * Generate a psuedo-random integer. Similar to Python's random.randint method.
 *
 * @param {number} [min] Minimum number (default: 1).
 * @param {number} [max] Maximum number (default: 10).
 * @return {number} Random integer.
 */
global.randint = function randint(min, max) {
	min = min != null ? +min : 1;
	max = max != null ? +max : 10;
	if (min >= max)
		return NaN;
	return Math.floor(Math.random() * (max - min + 1)) + min;
};

if (typeof Array.random !== "function")
Array.random = function random(a) {
	return a[Math.floor(Math.random() * a.length)];
};
if (typeof Array.prototype.random !== "function")
/**
 * Get a random element of an array. http://svendtofte.com/code/usefull_prototypes
 *
 * @this {Array}
 * @return {*} Random element from array.
 */
Array.prototype.random = function random() {
	return this[Math.floor(Math.random() * this.length)];
};

if (typeof Array.prototype.includes !== "function")
/**
 * ES6 shim: Check if an array contains an element.
 *
 * @this {Array} The array to check the contents of.
 * @param {*} e An element to check.
 * @return {Boolean} Whether the string contains the substring.
 */
Array.prototype.includes = function includes(e) {
	return this.indexOf(e) !== -1;
};

// Array generics

if (typeof Array.slice !== "function")
Array.slice = function slice(arr, start, end) {
	return Array.prototype.slice.call(arr, start, end);
};

if (typeof Array.join !== "function")
Array.join = function join(arr, sep) {
	return Array.prototype.join.call(arr, sep);
};

global.encodeB64 = function(a) {
	return new Buffer(a).toString("base64");
};

global.decodeB64 = function(a) {
	return new Buffer(a, "base64").toString("utf8");
};
// and now, for something completely different
if (typeof btoa !== "function" && typeof encodeB64 === "function")
	global.btoa = encodeB64;
if (typeof atob !== "function" && typeof decodeB64 === "function")
	global.atob = decodeB64;
