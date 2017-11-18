const fs = require('fs');
const database = require('./db');
const path = require('path');

const writeCode = (accessToken, code) => new Promise((resolve, reject) => {

	database.getLoginByAccessToken(accessToken)
	.then( login => {
		fs.writeFile(path(__dirname, '../../userfiles/', login+'.js'), code, function done(err) {
			console.log('user code successfull written (%s)', login);
			resolve(true);
		})
	}).catch( error => {
		console.log(error);
		reject(error);
	})
});

module.exports = {
	writeCode
}