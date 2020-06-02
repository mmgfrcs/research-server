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
    if(name === undefined) return data.researcher;
    if(pass === undefined) {
        
        let user = data.researcher.find(val=> val.name == name);
        if (user !== undefined) return user;
        else return undefined;
    }
    else {

        let user = data.researcher.find(val=> val.name == name);
        if (user !== undefined) {

            if(bcrypt.compareSync(pass, user.password) == true) return user;
            else return undefined;
            
        }
        else return undefined;
    }
}

/**
 * Add new user
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

/**
 * @typedef UserDbData
 * @property {string} name 
 * @property {string} pass
 * @property {string} clientId
 * @property {string} clientSecret 
 */

/**
 * Update user
 * @param {string} name The user's name.
 * @param {UserDbData} updateData The data object used to update the user.
 */
function updateUser(name, updateData) {
    let userIdx = data.researcher.findIndex(val => val.name == name);
    if(updateData.password !== undefined) {
        bcrypt.hash(updateData.pass, 10, function(err, hash) {
            if(err) {
                console.error(err);
                return;
            }
            data.researcher[userIdx].password = hash;
            if(updateData.name !== undefined) data.researcher[userIdx].name = updateData.name;
            if(updateData.clientId !== undefined) data.researcher[userIdx].clientId = updateData.clientId;
            if(updateData.clientSecret !== undefined) data.researcher[userIdx].clientSecret = updateData.clientSecret;
        })
    }
    else {
        if(updateData.name !== undefined) data.researcher[userIdx].name = updateData.name;
        if(updateData.clientId !== undefined) data.researcher[userIdx].clientId = updateData.clientId;
        if(updateData.clientSecret !== undefined) data.researcher[userIdx].clientSecret = updateData.clientSecret;
    }
    
}

module.exports = {
    init, getUserCount, findUser, insertUser, updateUser
}