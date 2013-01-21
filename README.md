aucgbot - auscompgeek's JavaScript IRC bot
==========================================

This bot is designed to be run with [JSDB](http://jsdb.org/) 1.8.0.6 or higher.

It is licensed under the [Mozilla Public License v. 2.0](http://mozilla.org/MPL/2.0/).

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

    Usage: !badword \[_nick_] [_word_|total]: Get how many times _nick_ has said _word_ (all if omitted). If _word_ = total, sum the counts.

    If you don't want messages from this module to be sent to a channel: rc js this.modules["badword"].sfwChans.push("_channel_")

  - **elf**: A unique Christmas game (across networks if you wish)!

    Runs in ##elf by default, to change: rc js this.modules["elf"].chan = "_channel_"

    Note, it will run in the same channel across all networks.

  - **tr**: Transform text!
    Commands:
      * tr "_text_" "_frm_" "_to_": Replaces each character in _frm_ with the corresponding character in _to_ within _text_.
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
run("aucgbot.js");
aucgbot.prefs[pref] = setting;
aucgbot.loadModule("helloworld");
aucgbot.start([hostname, port, nick, ident, pass, channels]...);
```

The above can be run from a script, not just from a jsdb prompt.
I don't recommend storing passwords on disk however.
Running ./start-aucgbot will prompt for modules and each server property.