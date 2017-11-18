const GameInformationAPI = require('./GameInformationAPI');

exports.move = (socketMessage) => {
	console.log('move')
	let target = {
		accessToken: socketMessage.accessToken,
		direction: socketMessage.direction
	};
	console.log(socketMessage);

	let self = this;
	console.log(this);
	GameInformationAPI.move(target)
		.then(moveObject => {
			let messageToAll = {
				action: 'move',
				object: moveObject,
			};
			self.broadcast(messageToAll);
		})
}

exports.attack = (socketMessage) => {

	let socket = this.clients[socketMessage.socketId];

	let target = {
		damage: socketMessage.damage,
		attackTargetId: socketMessage.attackTargetId,
		attackTargetType: socketMessage.attackTargetType
	}

	GameInformationAPI.attack(target);

	let messageToAll = {
		action: 'attack',
		object: target,
	};
	this.broadcast(messageToAll);
}

exports.use = (socketMessage) => {

	let socket = this.clients[socketMessage.socketId];

	let source = {
		useEffect: socketMessage.useEffect,
		useSourceId: socketMessage.useSourceId,
		useSourceType: socketMessage.useSourceType
	};

	let target = {
		useEffect: socketMessage.useEffect,
		useTargetId: socketMessage.useTargetId,
		useTargetType: socketMessage.useTargetType
	};

	let usable = {
		usableId: socketMessage.usableId,
		source: source,
		target: target,
	};

	GameInformationAPI.use(usable);

	let messageToAll = {
		action: 'use',
		object: usable,
	};
	this.broadcast(messageToAll);
}