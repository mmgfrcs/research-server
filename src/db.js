let bcrypt = require("bcrypt")

let data = {
    researcher: [],
    resData: []
};

function init() {
    data.researcher = [];
    data.resData = [];
}

/**
 * Get the number of users on the database
 */
function getUserCount() {
    return data.researcher.length;
}

/**
 * Find users or research data in the database
 * @param {string} name The user's name to find
 * @param {string} [pass] The user's password. Only supply this for authentication purposes.
 * @returns {object}
 */
function findUser(name, pass) {
    if(pass === undefined) {
        
        let user = data.researcher.find(val=> val == name);
        if (user !== undefined) return user;
        else return undefined;
    }
}

/**
 * 
 * @param {string} name The user's name.
 * @param {string} pass The user's password.
 */
function insertUser(name, pass) {
    bcrypt.hash(pass, 10, function(err, hash) {
        if(err) {
            console.error(err);
            return;
        }
        data.researcher.push({
            name: name,
            password: hash,
            clientId: "",
            clientSecret: ""
        })
    });
}

module.exports = {
    init, getUserCount, findUser, insertUser
}