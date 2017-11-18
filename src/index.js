const express = require('express');
const http = require('http');
const url = require('url');
const WebSocket = require('socket.io');

const app = express();
const socketActions = require('./GameAPISocketActions');

app.use(require('body-parser')());
app.get('/', (req, res) => res.send('ok'));

const server = http.createServer(app);
const WebSocketServer = WebSocket(server);

WebSocketServer.clients = {};

WebSocketServer.on('connection', function connection(webSocketClient) {
	
	console.log('someone connected, wainting authorization with access token')

	webSocketClient.on('auth', function incoming(authData) {
		console.log('received: %s', authData);
		let acessToken = authData.acessToken;
		let location = authData.location;

		WebSocketServer.clients[acessToken] = {
			socket: webSocketClient,
			location: location || '',
		};

		Object.keys(socketActions).forEach(function(actionName) {
			var fn = socketActions[actionName].bind(WebSocketServer);
			WebSocketServer.clients[acessToken].socket.on(actionName, fn);
		});

		WebSocketServer.clients[acessToken].socket.send('authed');

		webSocketClient.on('close', function() {
			console.log('соединение закрыто ' + acessToken);
			delete WebSocketServer.clients[acessToken];
		});
	});
});

WebSocketServer.broadcast = (data) => {
	Object.keys(WebSocketServer.clients).forEach(clientId => {
		if (WebSocketServer.clients[clientId].readyState === WebSocket.OPEN) {
			if (!data.action)
				WebSocketServer.clients[clientId].socket.send(data);
			else
				WebSocketServer.clients[clientId].socket.emit(data.action, data.object);
		}
	});
};

server.listen(8080, function listening() {
	console.log('Listening on %d', server.address().port);
});