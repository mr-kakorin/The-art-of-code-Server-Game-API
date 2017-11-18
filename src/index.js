const express = require('express');
const http = require('http');
const url = require('url');
const WebSocket = require('socket.io');
const database = require('./lib/db.js');
const dockerManager = require('./lib/dockerManager.js');
database.connect(require('../config.json').mysqlConnectionSettings);

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
		authData = JSON.parse(authData);
		let accessToken = authData.accessToken;
		let location = authData.location;

		webSocketClient.emit('auth', 'success');

		WebSocketServer.clients[accessToken] = {
			socket: webSocketClient,
			location: location || '',
		};

		Object.keys(socketActions).forEach(function(actionName) {
			var fn = socketActions[actionName].bind(WebSocketServer);
			WebSocketServer.clients[accessToken].socket.on(actionName, fn);
		});

		WebSocketServer.clients[accessToken].socket.send('authed');

		webSocketClient.on('close', function() {
			console.log('соединение закрыто ' + accessToken);
			delete WebSocketServer.clients[accessToken];
		});

		webSocketClient.on('code', function onCode (code) {
			console.log('try start code: %s', code);
			dockerManager.writeCode(accessToken, code)
			.then( () => {});
		})
	});

	webSocketClient.on('register', function register(registerData) {
		console.log('user register aka %s', registerData);
		registerData = JSON.parse(registerData);

		let login = registerData.login;
		let password = registerData.password;
		let herologin = registerData.nickname;

		database.register(login, password, herologin)
		.then( accessToken => {
			webSocketClient.emit('register', accessToken);
		});
	});

	webSocketClient.on('login', function login(loginData) {
		console.log('user login aka %s', loginData);
		loginData = JSON.parse(loginData);

		let login = loginData.login;
		let password = loginData.password;

		database.login(login, password)
		.then( accessToken => {
			webSocketClient.emit('login', accessToken);
		});
	})
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