const io = require('socket.io-client');

let url = process.argv[2];
console.log(url);
let socket = io.connect(url);

function makeid() {
  var text = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

  for (var i = 0; i < 5; i++)
    text += possible.charAt(Math.floor(Math.random() * possible.length));

  return text;
}
socket.on('connect', () => {
	let obj = {login: makeid(), password: 'password', nickname: 'nicknamedocker'};
	obj = JSON.stringify(obj, null, 4);
	/*socket.emit('register', obj);
	socket.on('register', data => {
		let obj = {accessToken: data};
		obj = JSON.stringify(obj, null, 4);
		socket.emit('auth', obj);
		socket.on('auth', data => {
			socket.emit('code', `let counter = setInterval( () => {console.log('${makeid()}');}, 5000)`)
		})
	})*/
	socket.emit('auth', JSON.stringify({accessToken:'e44054853487293b042aabbe43f2f910'}));
	socket.on('auth', obj => {
		socket.emit('code', `let counter = setInterval( () => {console.log('${makeid()}');}, 5000)`)
	})
	console.log('is connected')
});

socket.on('message', data => console.log(data));
socket.on('error', error => console.log(error));