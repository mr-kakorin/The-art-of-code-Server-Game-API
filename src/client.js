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
	socket.emit('register', obj);
	socket.on('register', data => {
		let obj = {accessToken: data};
		obj = JSON.stringify(obj, null, 4);
		socket.emit('auth', obj);
		socket.on('auth', data => {
			socket.emit('code', `let counter = setInterval( () => {console.log('${makeid()}');}, 5000)`)
		})
	})
	
	/*socket.emit('auth', JSON.stringify({accessToken:'8f218a4b929e620da0a75d741b7211e8'}));
	socket.on('auth', obj => {
		//socket.emit('code', `let counter = setInterval( () => {console.log('${makeid()}');}, 5000)`)
		socket.on('initData', data => {
			console.log(data);
		})
	})*/
	console.log('is connected')
});

socket.on('message', data => console.log(data));
socket.on('error', error => console.log(error));