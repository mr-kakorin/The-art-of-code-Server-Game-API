const fs = require('fs');
const path = require('path');

const singleton = Symbol();
const singletonMemory = Symbol();
const DB = require('./db');

class Memory {
	constructor(memory) {
		if (memory !== singletonMemory) {
			throw new Error('Cannot construct singleton');
		}

		this._type = 'Memory';
		this._locations = {};
		this._items = {};
		this._staticObjects = [];
		this._players = {};
		this._dynamicObjects = [];
		this._users = {};

		let locationsPath = path.join(__dirname, '../../resource/locations.json'),
			itemsPath = path.join(__dirname, '../../resource/items.json');

		this.LoadInMemoryJson(locationsPath)
			.then(resources => {
				this._locations = resources;
			});
		this.LoadInMemoryJson(itemsPath)
			.then(resources => {
				this._items = resources;
			});
		this.LoadInMemoryFromDB('heroes').then(resources => {
			this._players = resources;
		});
		this.LoadInMemoryFromDB('objects').then(resources => {
			this._staticObjects = resources;
		});
		this.LoadInMemoryFromDB('users').then(resources => {
			this._users = resources;
		});
	}

	static get instance() {
		if (!this[singleton]) {
			this[singleton] = new Memory(singletonMemory);
		}
		return this[singleton];
	}

	get locations() {
		return this._locations;
	}

	get items() {
		return this._items;
	}

	getHero(heroId) {
		let result = null;
		this._players.forEach(player => {
			if (player.id == heroId)
				result = player;
			return;
		})
		return result;
	}

	getHeroByAccessToken(accessToken) {
		let heroId = null;
		this._users.forEach(user => {
			if (user.accessToken == accessToken) {
				heroId = user.heroId;
			}
		})
		return this.getHero(heroId)
	}

	move(object, changePosition) {
		let moveObjectId = object.id,
			moveObjectType = object.type;
		let obj = null;
		switch (moveObjectType) {
			case "hero":
				this._players.forEach(player => {
					if (player.id == moveObjectId) {
						let newx = player.positionX + changePosition.x;
						let newy = player.positionY + changePosition.y;
						if (this.isFreePosition(newx, newy)) {
							console.log('чоблясука');
							player.positionX += changePosition.x;
							player.positionY += changePosition.y;
							obj = {
								x: player.positionX,
								y: player.positionY
							};
						} else return false;
					}
					return;
				})
				break;
			case "staticObject":
				this._staticObjects.forEach(sObject => {
					if (sObject.id == moveObjectId) {
						sObject.positionX += changePosition.x;
						sObject.positionY += changePosition.y;
					}
					return;
				})
				break;
			case "dynamicObject":
				this._dynamicObjects.forEach(dObject => {
					if (dObject.id == moveObjectId) {
						dObject.positionX += changePosition.x;
						dObject.positionY += changePosition.y;
					}
					return;
				})
				break;
		}
		return obj;
	}

	get objects() {
		return this._objects;
	}

	isFreePosition(x, y) {
		let result = true;
		this._staticObjects.forEach(obj => {
			if (obj.x == x && obj.y == y) {
				result = false;
			}
		})
		this._dynamicObjects.forEach(obj => {
			if (obj.x == x && obj.y == y) {
				result = false;
			}
		})
		console.log('reorhk', result);
		return result;
	}

	LoadInMemoryJson(resourcePath) {
		return new Promise((resolve, reject) => {
			fs.readFile(resourcePath, 'utf8', function(err, data) {
				if (!err) {
					console.log(`Success read resource ${resourcePath}`);
					resolve(JSON.parse(data));
				} else {
					console.log(`Error read resource ${resourcePath}`);
				}
			});
		});
	}

	LoadInMemoryFromDB(tableName) {
		return DB.loadContent(tableName)
	}

	get type() {
		return this._type;
	}

	set type(value) {
		this._type = value;
	}
}


module.exports = Memory;