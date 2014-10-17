#!/bin/sh

NODEJS_PATH=`which node`

if [ ! -e $NODEJS_PATH  -o ! -x $NODEJS_PATH ]; then
	echo "Couldn't find node.js as 'node', trying 'nodejs'..."
	NODEJS_PATH=`which nodejs`

	if [ ! -e $NODEJS_PATH -o ! -x $NODEJS_PATH ]; then
		echo -n "Still no node.js, please enter the path to your Node binary: "
		read NODEJS_PATH
	fi
fi
echo "Found node.js at $NODEJS_PATH"
AUCGBOT_PATH="start-aucgbot"
if [ ! -e $AUCGBOT_PATH ]; then
	echo "start-aucgbot doesn't seem to exist here!"
	echo -n "Enter the path to start-aucgbot: "
	read AUCGBOT_PATH
fi

echo "Starting aucgbot using node.js in $NODEJS_PATH..."
$NODEJS_PATH --harmony --use-strict $AUCGBOT_PATH

