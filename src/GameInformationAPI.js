const DB = require("./lib/db");
const ManageCurrentMemory = require('./lib/mem')

const DBStateSaveBehaviourTargets = ['heroes', 'objects'];

const move = (target) => {
	if (DBStateSaveBehaviourTargets.indexOf(target.moveTargetType) != -1) {
		let object = {
			id: target.moveTargetId,
			type: target.moveTargetType,
		}
		DB.move(object, target.moveTargetType);
	} else {
		let object = {
			id: target.moveTargetId,
			type: target.moveTargetType,
		}

	}
}

module.exports = {
	move: move,
	attack: attack,
	use: use
}