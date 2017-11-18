const fs = require('fs');
const database = require('./db');
const path = require('path');
const exec = require('child_process').exec;

const writeCode = (accessToken, code) => new Promise((resolve, reject) => {

	database.getLoginByAccessToken(accessToken)
	.then( login => {
		fs.writeFile(path.join(__dirname, '../../userfiles/', login+'.js'), code, function done(err) {
			console.log('user code successfull written (%s)', login);
			resolve(true);
		})
	}).catch( error => {
		console.log(error);
		reject(error);
	})
});

const restartCode = (accessToken) => new Promise( (resolve, reject) => {
	database.getLoginByAccessToken(accessToken)
	.then( login => {
		exec(`docker exec ${login} ./restart.sh http://91.225.131.223:8080/code/${login}`, (e, so, se) => {
			console.log(`\t try restart code: ${so}`);
			console.log(`\t try restart code ${se}`);
			resolve(true);
		});		
	})
})

const createContainer = (login, accessToken) => new Promise( (resolve, reject) => {
	exec(`docker run -d -e ACCESS_TOKEN=${accessToken} --name ${login} exampleocker`, (e, so, se) => {
		console.log(`\t try start container: ${so}`);
		console.log(`\t try start container: ${se}`);
		resolve(true);
	})
});

module.exports = {
	writeCode,
	createContainer,
	restartCode
}