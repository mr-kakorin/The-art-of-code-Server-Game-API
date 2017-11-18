const io = require('socket.io-client');

let url = process.argv[2];
console.log(url);
let socket = io.connect(url);

socket.on('connect', () => {
	console.log('is connected')
	socket.emit('auth', {accessToken:'token'});
});

socket.on('message', data => console.log(data));
socket.on('error', error => console.log(error));