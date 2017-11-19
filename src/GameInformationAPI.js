const DB = require("./lib/db");
const ManageCurrentMemory = require('./lib/mem');

const DBStateSaveBehaviourTargets = ['heroes', 'objects'];

const directionToCoordinate = (direction) => {
	let changePosition = {};
	switch (direction) {
		case 'up':
			changePosition.x = 0;
			changePosition.y = 1;
			break;
		case 'down':
			changePosition.x = 0;
			changePosition.y = -1;
			break;
		case 'left':
			changePosition.x = -1;
			changePosition.y = 0;
			break;
		case 'right':
			changePosition.x = 1;
			changePosition.y = 0;
			break;
	}
	return changePosition;
}

const move = (target) => {
	return new Promise((resolve, reject) => {
		let accessToken = target.accessToken.replace('docker', '');
		let hero = ManageCurrentMemory.instance.getHeroByAccessToken(accessToken);

		let object = {
			id: hero.id,
			type: 'hero',
		}
		console.log('heroid: ', hero.id);

		let changePosition = directionToCoordinate(target.direction);

		let npos = ManageCurrentMemory.instance.move(object, changePosition);

		if (npos) {
			resolve({
				object: object,
				newPosition: npos
			});
			if (DBStateSaveBehaviourTargets.indexOf(target.moveTargetType) != -1) {
				DB.move(object, changePosition);
			}
		}
	});
}

const attack = (target) => {
	return new Promise( (resolve, reject) => {
		let accessToken = target.accessToken.replace('docker', '');
		let hero = ManageCurrentMemory.instance.getHeroByAccessToken(accessToken);
		let obj = ManageCurrentMemory.instance.getObjectById(target.objectId);

		console.log(hero, obj);
		let diffX = Math.abs( hero.positionX - obj.positionX );
		let diffY = Math.abs( hero.positionY - obj.positionY );

		if ( diffX + diffY > 1 ) {
			resolve(false);
			return;
		}

		let damage = hero.attack - obj.stats.defense;
		obj.stats.hp -= damage

		if ( obj.stats.hp <= 0 ) {
			ManageCurrentMemory.instance.deleteObjectById(obj.id);

			resolve({
				action: 'dead',
				objectId: obj.id
			})
		} else {

			resolve({
				action: 'update',
				objectId: obj.id,
				object: obj
			})
		}

	})
}

module.exports = {
	move: move,
	attack
}