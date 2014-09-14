aucgbot - auscompgeek's JavaScript IRC bot
==========================================

This bot is designed to be run with [NodeJS](http://nodejs.org/) 0.10.31 or higher.

It is licensed under the [Mozilla Public License v. 2.0](http://mozilla.org/MPL/2.0/).

aucgbot can typically be found live on freenode with the nick "seedbot".

Features
--------

  - Generalised per-connection flood protection.
  - Logging.
  - Remote control.
  - Multi-server support.
  - Modular.

### Calculator (calcbot) features
  - Error reporting.
  - Dice.
  - Temperature conversion.
  - Base conversion.
  - Solve quadratic equations.

### Other modules
  - **infobot**: Create and recall factoids! (Database stored across channels and networks.)
    Commands:
      * def: define factoids
      * no: redefine factoids
      * reloadfacts: reload factoid database (e.g. if edited by hand)
      * what is/fact/info: recall factoids
      * tell: send factoid to someone in PM
      * show: target factoid at someone in channel

  - **badword**: Track a person's usage of "bad words"! (Database stored across channels and networks.)

    Usage: !badword \[*nick*] [*word*|total]: Get how many times *nick* has said *word* (all if omitted). If *word* = total, sum the counts.

    If you don't want messages from this module to be sent to a channel: rc js `this.modules["badword"].sfwChans.push("channel")`

  - **elf**: A unique Christmas game (across networks if you wish)!

    Runs in ##elf by default, to change: rc js `this.modules["elf"].chan = "channel"`

    Note, it will run in the same channel across all networks.

  - **tr**: Transform text!
    Commands:
      * tr "*text*" "*frm*" "*to*": Replaces each character in *frm* with the corresponding character in *to* within *text*.
      * rot13: ROT13. If you don't know what it is, Google it.
      * rot47: ROT47. Google it.
      * rev: Reverse the text.
      * encode/decode: Encode/decode text.

    Encodings:

      * base64
      * html
      * url
      * charcode: a.k.a. dec encoding. Isn't exactly the same with Unicode characters however.
      * albhed: The Al Bhed language from Final Fantasy X, for all those FF fans out there.

  - **yt**: YouTube! Get info about a YouTube video before clicking the link!

  - **google**: Google!

Basic usage
-----------

``` javascript
require("aucgbot.js");
aucgbot.prefs[pref] = setting;
aucgbot.loadModule("helloworld");
aucgbot.start([hostname, port, nick, ident, pass, channels]...);
```

Note that the bot should be run using `node --harmony --use-strict`.

The above can be run from a script, not just from a jsdb prompt.
I don't recommend storing passwords on disk however.
Editing `./start-aucgbot` and then running it will launch the bot.

License
-------

The majority of aucgbot's codebase is licensed under the MPL.
Portions of the codebase are under other licenses. See each file for more details.
