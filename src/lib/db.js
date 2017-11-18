const mysql = require('mysql2/promise');
const config = require('../config.json');

const state = {
    db: null
};

const connect = (opts, done) => {
    if (!done) done = () => {};
    if (state.db) {
        return done();
    }

    mysql.createConnection(opts)
        .then(connection => {
            console.log('mysql connected')
            state.db = connection;
            state.db.query("SET SESSION wait_timeout = 604800");

            const handleDisconnect = () => {
                state.db.query('select 1;')
                    .then(response => {
                        if (!response.Error)
                            return true;
                        else
                            throw new Error('MySQL is in need to reconnect');
                    })
                    .catch(err => {
                        mysql.createConnection(opts)
                            .then(connection => {
                                console.log('MySQL is reconnected');
                                state.db = connection;
                                state.db.query("SET SESSION wait_timeout = 604800");
                                setTimeout(handleDisconnect, 1800000);
                            })
                            .catch(err => {
                                console.log('Can not reconnect to MySQL:\n', err);
                                setTimeout(handleDisconnect, 2000);
                            })
                    })
            };

            done();

            try {
                handleDisconnect()
            } catch (e) {
                console.log('Error handleDisconnect Mysql:\n', e);
            }

        })
        .catch(err => done(err));
}

const disconnect = () => {
    state.db.end();
}

const get = () => {
    return state.db;
}

const register = (login, password, nickname) => new Promise((resolve, reject) => {
    let db = get();

    let accessToken = guid();
    let dockerName = login + 'Docker'

    let userId = null;

    db.execute(
            `
            insert into users
            ( login, password, accessToken, docker )
            values
            ( ${SqlString(login)}, ${SqlString(password)}, ${SqlString(accessToken)}, ${SqlString(dockerName)} );
        `
        )
        .then(result => {

            console.log(result);
            userId = result[0].insertId;
            let str = `
                insert into heroes
                    (
                        login, 
                        userId, 
                        positionX, 
                        positionY, 
                        HP, 
                        maxHP, 
                        attack, 
                        defence, 
                        lvl, 
                        exp,
                        location
                    )
                values
                    (
                        ${SqlString(nickname)},
                        ${result[0].insertId},
                        0,
                        0,
                        100,
                        100,
                        15,
                        5,
                        1,
                        0,
                        'location'
                    );
            `;
            console.log(str);
            return db.execute(str);
        })
        .then(result => {

            return db.execute(`update users set heroId=${result[0].insertId} where id=${userId};`)
        })
        .then(() => {
            resolve(accessToken);
        })
        .catch(error => {
            console.log(error);
        });
})

const login = (login, password) => new Promise((resolve, reject) => {
    let db = get();

    db.execute(`select * from users where login=${SqlString(login)};`)
        .then(([rows, fields]) => {
            let accessToken = rows[0].accessToken;

            resolve(accessToken);
        }).catch(error => {
            console.log(error);
            reject(error);
        })
})

const getLoginByAccessToken = accessToken => new Promise((resolve, reject) => {
    let db = get();

    db.execute(`select login from users where accessToken=${SqlString(accessToken)};`)
        .then(([rows, fields]) => {
            resolve(rows[0].login);
        }).catch(error => {
            console.log(error);
            reject(error);
        })
})

const getHeroIdByToken = accessToken => new Promise((resolve, reject) => {
    let db = get();

    db.execute(`select heroId from users where accessToken=${SqlString(accessToken)};`)
        .then(([rows, fields]) => {
            resolve(rows[0].id);
        })
        .catch(error => {
            console.log(error);
            reject(error);
        })
})

const move = (object, changePosition) => {
    let db = get(),
        moveObjectId = object.id,
        fromWhatMove = object.type === 'hero' ? "heroes" : "objects";

    db.execute(
        `
            update ${fromWhatMove} 
            set positionX = positionX + ${newPosition.x}, positionY = positionY + ${newPosition.y}
            where id = ${moveObjectId};
        `
    ).catch(console.log)
}

const changeFiled = (object, newValue, predicate) => {
    let db = get(),
        changeObjectId = object.id,
        changeObjectType = object.type,
        fieldToChange = predicate.field;

    let fromWhatMove = changeObjectType === 'hero' ? "heroes" : "Object";

    db.execute(
        `
            update ${fromWhatMove} 
            set ${fieldToChange} = ${newValue}
            where id = ${changeObjectId};
        `
    ).catch(console.log)
}
const loadContent = (table) => new Promise((resolve, reject) => {
    state.db.execute(`select * from ${table};`)
        .then(([rows, fileds]) => {
            resolve(rows)
        })
        .catch(console.log);
});

const SqlString = (s) => {
    if (s)
        s = s.replace(/[\0\x08\x09\x1a\n\r''\\\%]/g, function(char) {
            switch (char) {
                case '\0':
                    return '\\0';
                case '\x08':
                    return '\\b';
                case '\x09':
                    return '\\t';
                case '\x1a':
                    return '\\z';
                case '\n':
                    return '\\n';
                case '\r':
                    return '\\r';
                case '\'':
                case '"':
                case '\\':
                case '%':
                    return '\\' + char;
            }
        });
    return (s === null ? 'NULL' : `'${s}'`);
}

const SqlNum = (n) => (n === null || isNaN(n) ? 'NULL' : `${n}`);

const SqlBool = (b) => {
    switch (b) {
        case true:
            return 'TRUE';

        case false:
            return 'FALSE';

        case null:
            return 'NULL';
    }
};

function guid() {
    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000)
            .toString(16)
            .substring(1);
    }
    return s4() + s4() + s4() + s4() +
        s4() + s4() + s4() + s4();
}

module.exports = {
    connect: connect,
    disconnect: disconnect,
    get: get,
    register,
    login,
    getLoginByAccessToken,
    move: move,
    changeFiled: changeFiled,
    loadContent,
    getHeroIdByToken
};