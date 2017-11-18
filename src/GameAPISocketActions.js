//const GameInformationAPI = require('./GameInformationAPI');

exports.move = (socketMessage) => {

	let socket = this.clients[socketMessage.socketId];

	let target = {
		newPosition: socketMessage.newPosition,
		moveTargetId: socketMessage.moveTargetId,
	}

	//GameInformationAPI.move(target);

	let messageToAll = {
		action: 'move',
		object: target,
	};
	this.broadcast(messageToAll);
}

exports.attack = (socketMessage) => {

	let socket = this.clients[socketMessage.socketId];

	let target = {
		damage: socketMessage.damage,
		attackTargetId: socketMessage.attackTargetId,
	}

	//GameInformationAPI.attack(target);

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
	};

	let target = {
		useEffect: socketMessage.useEffect,
		useTargetId: socketMessage.useTargetId,
	};

	let usable = {
		usableId:socketMessage.usableId,
		source:source,
		target:target,
	};

	//GameInformationAPI.use(usable);

	let messageToAll = {
		action: 'use',
		object: usable,
	};
	this.broadcast(messageToAll);
}