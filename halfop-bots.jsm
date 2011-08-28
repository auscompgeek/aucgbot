module.version = 1;
module.parseln =
function parseln(ln, serv)
{	if (/^:(\S+)!\S+@\S+ JOIN :#bots\r/.test(ln))
	{	nick = RegExp.$1;
		if (/^bot|bot[\d_]*$/.test(RegExp.$1))
			aucgbot.send("MODE #bots +h", nick);
		else
			aucgbot.send("WHO", nick);
	} else if (/^:\S+ 352 \S+ #bots \S+ \S+ (\S+) (\S+) :\d+ \S+/.test(ln))
	{	nick = RegExp.$1;
		if (/B/.test(RegExp.$2)) aucgbot.send("MODE #bots +h", nick);
	}
}