let bcrypt = require("bcrypt");
let mongoose = require("mongoose");
const logger = require("./logger");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

//Models
let Researcher = require("../models/researcherModel");
let Research = require("../models/researchModel");

let dbUri = process.env.MONGODB_URI;

/**
 * Initialize the database connection
 * @returns {Promise<void>} A Promise to wait for connection to be established.
 */
function init() {
    mongoose.set('useFindAndModify', false);
    return mongoose.connect(dbUri, {useNewUrlParser: true, useUnifiedTopology: true}).then(()=> {
        logger.info("MongoDB Connected");
    }).catch((err) => {
        logger.error(err);
    });
}

async function getUserCount() {
    return (await getUsers()).length;
}

/**
 * @typedef UserDbData
 * @property {string} name The user's name
 * @property {string} password The user's password
 * @property {string} token The user's access token
 * @property {string} secret The user's secret
 * @property {Number} permission The user's permission level (0-2)
 */

/**
 * Get all users
 * @returns {Promise<UserDbData[]>} A Promise resolving in all users returned.
 */
function getUsers() {
    return Researcher.find().lean().exec();
}

/**
 * Find a user in the database
 * @param {UserDbData} predicate The search object to match against
 */
function findUser(predicate) {
    return Researcher.findOne(predicate).lean().exec();
}

function verifyUser(name, password) {
    return findUser({name: name}).then((user) => {
        return bcrypt.compare(password, user.password);
    }).then(verified => {
        return verified;
    });
}

/**
 * Add new user
 * @param {string} name The user's name.
 * @param {string} pass The user's password.
 * @param {boolean} gentoken Whether to generate token immediately.
 * @param {boolean} admin whether this user should be the admin of the site.
 * @returns A Promise which resolves to the inserted user
 */
function insertUser(name, pass, gentoken, admin) {
    return findUser({name: name}).then((user) => {
        if(user !== null) throw new Error("Researcher with that name already exists");
        return bcrypt.hash(pass, 10);
    }).then((hash) => {
        let sec = "";
        let tok = "";
        if(gentoken) {
            sec = crypto.randomBytes(20).toString('hex');
            tok = jwt.sign(name, sec);
        }
        
        let newUser = new Researcher({
            name: name,
            password: hash,
            token: tok,
            secret: sec,
            permission: admin == true ? 2 : 0,
        });
        return newUser.save();
    });
}

/**
 * Update a user
 * @param {string} name The user's name.
 * @param {UserDbData} updateData The data object used to update the user.
 */
function updateUser(name, updateData) {
    return new Promise((resolve) => {
        if(updateData.password !== undefined) return bcrypt.hash(updateData.password, 10);
        else return resolve(updateData.password);
    }).then((hash) => {
        updateData.password = hash;
        return Researcher.findOneAndUpdate({name: name}, updateData);
    });
}

/**
 * Delete a user from the database
 * @param {String} name The user's name to delete
 */
function deleteUser(name) {
    return Researcher.findOneAndDelete({name: name}).exec();
}

/**
 * @typedef ResearchDbData
 * @property {String} name
 * @property {String} researchId
 * @property {String[]} researchers
 * @property {Object[]} data
 */

/**
 * Get all researches
 * @returns {Promise<ResearchDbData[]>}
 */
function getResearches() {
    return Research.find().lean().exec();
}

/**
 * 
 * @param {String} name The research name
 * @returns {Promise<ResearchDbData>}
 */
function findResearchByName(name) {
    return Research.findOne({name: name}).lean().exec();
}

function findResearchById(researchId) {
    return Research.findOne({researchId: researchId}).lean().exec();
}

function insertResearch(name, ...researchers) {
    return findResearchByName(name).then((res) => {
        if(res !== null) return Promise.reject(new Error("Research with that name already exists"));
        let newResearch = new Research({
            name: name,
            researchers: researchers,
            researchId: crypto.randomBytes(10).toString('hex'),
            data: []
        });
            
        return newResearch.save();
    });

}

function insertResearchData(name, resData) {
    return Research.findOne({name: name}).exec().then(res => {
        res.data.push(resData);
        return res.save();
    });
}

function renameResearch(name, newName) {
    return findResearchByName(name).then(res=>{
        if(res !== null) return bcrypt.hash(newName, 10);
        else return Promise.reject("Research with that name doesn't exist");
    }).then(hash=> {
        return Research.findOneAndUpdate({name: name}, {name: newName, researchId: hash}).exec();
    });

}

function deleteResearch(name){
    return Research.findOneAndDelete({name: name}).exec();
}

module.exports = {
    init, getUserCount, getUsers, findUser, verifyUser, insertUser, updateUser, deleteUser, getResearches, 
    insertResearch, findResearchById, findResearchByName, insertResearchData, renameResearch, deleteResearch
};