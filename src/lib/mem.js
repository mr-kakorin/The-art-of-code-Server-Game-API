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



	updateUsers() {
		this.LoadInMemoryFromDB('users').then(resources => {
			this._users = resources;
		});
	}
	updateHeroes() {
		this.LoadInMemoryFromDB('heroes').then(resources => {
			this._players = resources;
		});
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
		console.log(this._users);
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
		return this._staticObjects.concat(this._dynamicObjects);
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
		return result;
	}

	calcNumMobs(type) {
		let result = 0;
		this._dynamicObjects.forEach(dObject => {
			let stats = dObject.stats;
			if (stats) {
				if (stats.name == type)
					++result;
			}
		});
		return result;
	}

	spawnMobs() {
		let mobsPath = path.join(__dirname, '../../resource/mobs.json');
		this._mobsConf = {};
		let self = this;
		self.LoadInMemoryJson(mobsPath)
			.then(resource => {
				self._mobsConf = resource;
				return self._mobsConf[0];
			})
			.then(boarConf => {
				let x = getRandomInt(0, 100),
					y = getRandomInt(0, 100);

				while (!self.isFreePosition(x, y)) {
					x = getRandomInt(0, 100);
					y = getRandomInt(0, 100);
				}

				let boar = {
					type: "mob",
					id: getRandomInt(0, 10000),
					positionX: x,
					positionY: y,
					stats: boarConf,
					name:"boar"
				};
				self._dynamicObjects.push(boar);
				self.notifyAllClients('mobSpawned', boar);
			})
	}

	spawnRoutine() {
		let self = this;

		if (this.calcNumMobs('boar') > 400) {
			this._spawn = false;
			return;
		}

		setTimeout(self.spawnMobs.bind(self), 5000);
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

	/**
	 * [notifyAllClients description]
	 * @param  {[type]} clients [web socket]
	 * @return {[type]}         [description]
	 */
	notifyAllClients() {
		let args = [].slice.call(arguments);
		let clients, event, data;
		if (args.length > 2) {
			clients = args[0];
			event = args[1];
			data = args[2];
		} else {
			event = args[0];
			data = args[1];
		}

		if (!this._clients) {
			this._clients = clients;
		}
		let self = this;
		if (this._clients)
			Object.keys(this._clients).forEach(clientId => {
				self._clients[clientId].socket.emit(event, JSON.stringify(data));
			});
	}

	updateClients(clients) {
		this._clients = clients;
		if (this.calcNumMobs('boar') < 400 && !this._spawn) {
			this.spawnRoutine();
		}
	}

	get type() {
		return this._type;
	}

	set type(value) {
		this._type = value;
	}
}

function getRandomInt(min, max) {
	return Math.floor(Math.random() * (max - min)) + min;
}

module.exports = Memory;