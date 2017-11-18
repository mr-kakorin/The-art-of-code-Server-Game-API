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
		this._staticObjects = {};
		this._players = {};
		this._dynamicObjects = {};

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

	move(object, newPosition) {
		moveObjectId = object.id,
			this._dynamicObjects.forEach(dObject => {
				if (dObject.id == moveObjectId) {
					dObject.positionX = newPosition.x;
					dObject.positionY = newPosition.y;
				}
				return;
			})
	}

	get objects() {
		return this._objects;
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