const express = require('express');
const http = require('http');
const url = require('url');
const WebSocket = require('socket.io');

const app = express();
const socketActions = require('./GameAPISocketActions');

app.use(function(req, res) {

});

const server = http.createServer(app);
const wss = WebSocket(server);

let wss.clients = {};

wss.on('connection', function connection(ws, req) {
	const location = url.parse(req.url, true);

	// You might use location.query.access_token to authenticate or share sessions
	// or req.headers.cookie (see http://stackoverflow.com/a/16395220/151312)
	let id = Math.random();

	wss.clients[id] = {
		socket: ws,
		location: location
	};

	Object.keys(socketActions).forEach(function(actionName) {
		var fn = socketActions[actionName].bind(wss);
		clients[id].ws.on(actionName, fn);
	});

	ws.on('message', function incoming(message) {
		console.log('received: %s', message);
	});

	ws.on('close', function() {
		console.log('соединение закрыто ' + id);
		delete clients[id];
	});
});

wss.broadcast = (data) => {
	Object.keys(wss.clients).forEach(clientId => {
		if (wss.clients[clientId].readyState === WebSocket.OPEN) {
			if(!data.action)
				wss.clients[clientId].send(data);
			else
				wss.emit(data.action, data.object);
		}
	});
};

server.listen(8080, function listening() {
	console.log('Listening on %d', server.address().port);
});