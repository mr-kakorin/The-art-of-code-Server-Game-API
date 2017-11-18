const mysql = require('mysql2/promise');
const config = require('../config.json');

const state = {
    db: null
};

const connect = (opts, done) => {
    if (state.db) {
        return done();
    }

    mysql.createConnection(opts)
        .then(connection => {
            state.db = connection;
            state.db.query("SET SESSION wait_timeout = 604800");

            const handleDisconnect = () => {
                mysql_obj.connection.query('select 1;')
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

            try {
                handleDisconnect()
            } catch (e) {
                console.log('Error handleDisconnect Mysql:\n', e);
            }

            done();
        })
        .catch(err => done(err));
}

const disconnect = () => {
    state.db.end();
}

const get = () => {
    return state.db;
}

const register = (login, passowrd, nickname) => new Promise( (resolve, reject) => {
    let db = get();

    let accessToken = guid();
    let dockerName = login+'Docker'

    let userId = null;

    db.execute(
        `
            insert into users
            ( login, password, accessToken, docker )
            values
            ( ${SqlString(login)}, ${SqlString(password)}, ${SqlString(accessToken)}, ${SqlString(docker)} );
        `
    )
    .then( result => {

        userId = result.insertId;
        return db.execute(
            `
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
                        exp
                    )
                values
                    (
                        ${SqlString(nickname)},
                        ${result.insertId},
                        0,
                        0,
                        100,
                        100,
                        15,
                        5,
                        1,
                        0
                    );
            `
        )
    })
    .then( result => {

        return db.execute(`update users set heroId=${result.insertId} where id=${userId};`)
    })
    .then( () => {
        resolve(accessToken);
    })
    .catch(reject);
})

const move = (object, newPosition) => {
    let db = get(),
        moveObjectId = object.id,
        fromWhatMove = object.type === 'hero' ? "heroes" : "objects";

    db.execute(
        `
            update ${fromWhatMove} 
            set positionX = ${newPosition.x}, positionY = ${newPosition.y}
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

function guid () {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }
  return s4()+s4()+s4()+s4()+
    s4()+s4()+s4()+s4();
}

module.exports = {
    connect: connect,
    disconnect: disconnect,
    get: get,
    register
    move: move,
    changeFiled: changeFiled,
};