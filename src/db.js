let bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

let data = {
    researcher: [],
    researches: []
};

function init() {
    data.researcher = [];
    data.researches = [];
}
/**
 * Find users or research data in the database
 * @param {string} name The user's name to find
 * @param {string} [pass] The user's password. Only supply this for authentication purposes.
 * @returns {object}
 */
function findUser(name, pass) {
    if(name === undefined) return data.researcher;
    if(pass === undefined) return data.researcher.find(val=> val.name == name);
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
 * @param {boolean} gentoken Whether to generate token immediately.
 * @param {boolean} admin whether this user should be the admin of the site.
 * @returns {Promise}
 */
function insertUser(name, pass, gentoken, admin) {
    return new Promise((resolve, reject) => {
        if(data.researcher.find(x=>x.name == name) !== undefined) return reject(new Error("Researcher with that name already exists"));
        bcrypt.hash(pass, 10, function(err, hash) {
            if(err) {
                console.error(err);
                return reject(err);
            }
            let sec = "";
            let tok = "";
            if(gentoken) {
                sec = crypto.randomBytes(20).toString('hex');
                tok = jwt.sign(name, sec);
            }
    
            data.researcher.push({
                name: name,
                password: hash,
                token: tok,
                secret: sec,
                permission: admin == true ? 2 : 0
            });
            resolve();
        });
    });

}

/**
 * @typedef UserDbData
 * @property {string} name 
 * @property {string} pass
 * @property {string} token
 * @property {string} secret 
 * @property {Number} permission
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
            if(updateData.token !== undefined) data.researcher[userIdx].token = updateData.token;
            if(updateData.secret !== undefined) data.researcher[userIdx].secret = updateData.secret;
        });
    }
    else {
        if(updateData.name !== undefined) data.researcher[userIdx].name = updateData.name;
        if(updateData.token !== undefined) data.researcher[userIdx].token = updateData.token;
        if(updateData.secret !== undefined) data.researcher[userIdx].secret = updateData.secret;
    }
    
}

function getUsers(callingUser) {
    if(callingUser !== undefined && callingUser.permission == 2)
        return data.researcher;
    else return [];
}

function deleteUser(name) {
    let user = findUser(name);
    if(user !== undefined) {
        let idx = data.researcher.indexOf(user);
        if (idx > -1) data.researcher.splice(idx, 1);
        
    }
}

function getResearches() {
    return data.researches;
}

function findResearch(nameOrResId) {
    let rs = data.researcher.find(val=> val.name == nameOrResId);
    if(rs === undefined) return data.researcher.find(val=> val.researchId == nameOrResId);
    return rs;
}

function insertResearch(name, ...researchers) {
    bcrypt.hash(name, 10, function(err, hash) {
        if(err) {
            console.error(err);
            return;
        }
        data.researches.push({
            name: name,
            researchers: researchers,
            researchId: hash,
            data: []
        });
    });
}

function insertResearchData(name, resData) {
    let userIdx = data.researches.findIndex(val => val.name == name);
    data.researches[userIdx].data.push(resData);
}

function renameResearch(name, newName) {
    let userIdx = data.researches.findIndex(val => val.name == name);
    bcrypt.hash(newName, 10, function(err, hash) {
        if(err) {
            console.error(err);
            return;
        }
        data.researches[userIdx].name = name;
        data.researches[userIdx].researchId = hash;
    });
}

function deleteResearch(name){
    let user = findUser(name);
    if(user !== undefined) {
        let idx = data.researcher.indexOf(user);
        if (idx > -1) data.researcher.splice(idx, 1);
        
    }
}

module.exports = {
    init, getUsers, findUser, insertUser, updateUser, deleteUser, getResearches, 
    insertResearch, findResearch, insertResearchData, renameResearch, deleteResearch
};