let bcrypt = require("bcrypt");
let mongoose = require("mongoose");
const logger = require("./logger").child({type: "MongoDB"});
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
    mongoose.set('debug', function(coll, method, query, doc) {
        logger.debug(`${coll}.${method} ${JSON.stringify(query)} ${doc}`);
    });
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
    return Researcher.find({}, {"_id": false, "__v": false}).lean().exec();
}

/**
 * Find a user in the database
 * @param {UserDbData} predicate The search object to match against
 */
function findUser(predicate) {
    return Researcher.findOne(predicate, {"_id": false, "__v": false}).lean().exec().then(val => {
        if(val == null) throw new Error("Researcher not found");
        else return val;
    });
}

function userExists(predicate) {
    return findUser(predicate).then(() => true).catch(() => false);
}

function verifyUser(nameOrSecret, password) {
    if(password !== undefined) {
        return findUser({name: nameOrSecret}).then((user) => {
            return bcrypt.compare(password, user.password);
        }).then(verified => {
            return verified;
        });
    }
    else {
        return findUser({secret: nameOrSecret}).then((user) => {
            return user !== null;
        });
    }
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
    return userExists({name: name}).then(exists => {
        if(exists) throw new Error("Research with that name already exists");
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
    return Research.find({}, {"_id": false, "__v": false}).lean().exec();
}

/**
 * 
 * @param {String} name The research name
 * @returns {Promise<ResearchDbData>}
 */
function findResearchByName(name) {
    return Research.findOne({name: name}, {"_id": false, "__v": false}).lean().exec().then(val => {
        if(val == null) throw new Error("Research not found");
        else return val;
    });
}

/**
 * 
 * @param {String} researchId The research ID
 * @returns {Promise<ResearchDbData>}
 */
function findResearchById(researchId) {
    return Research.findOne({researchId: researchId}, {"_id": false, "__v": false}).lean().exec().then(val => {
        if(val == null) throw new Error("Research not found");
        else return val;
    });
}

function researchExistsByName(name) {
    return findResearchByName(name).then(() => true).catch(() => false);
}

function researchExistsById(researchId) {
    return findResearchById(researchId).then(() => true).catch(() => false);
}

function insertResearch(name, ...researchers) {
    return researchExistsByName(name).then((exists) => {
        if(exists) throw new Error("Research with that name already exists");
        let set = new Set(researchers);
        return Promise.all(Array.from(set).map(async (researcher) => {
            await findUser({name: researcher});
            return researcher;
        }));
    }).then(vals=> {
        let newResearch = new Research({
            name: name,
            researchers: vals,
            researchId: crypto.randomBytes(20).toString('hex'),
            data: []
        });
            
        return newResearch.save();
    });
}

function insertResearchData(researchId, resData) {
    return Research.findOne({researchId: researchId}).exec().then(res => {
        if(res == null) throw new Error("Research not found");
        res.data.push(resData);
        return res.save();
    });
}

/**
 * Insert new researchers to research
 * @param {String} researchId The research to add to, found by its ID
 * @param {Array<String>} researchers The array of researcher names
 */
function insertResearchers(researchId, researchers) {
    return Research.findOne({researchId: researchId}).exec().then(res => {
        if(res == null) throw new Error("Research not found");

        researchers.push(...res.researchers);
        let set = new Set(researchers);
        return Promise.all(Array.from(set).map(async (researcher) => {
            await findUser({name: researcher});
            return researcher;
        })).then(resName=>{
            res.researchers = resName;
            return res.save();
        });
    });
}

/**
 * Delete a researcher
 * @param {String} researchId The research to delete from, found by its ID
 * @param {String} researcher The name of researcher to delete
 */
function deleteResearcher(researchId, researcher) {
    return Research.findOne({researchId: researchId}).exec().then(res => {
        if(res == null) throw new Error("Research not found");

        let idx = res.researchers.indexOf(researcher);
        if(idx < 0) throw new Error("Researcher not found");
        res.researchers.splice(idx, 1);
        return res.save();
    });
}

function renameResearch(researchId, newName) {
    return findResearchById(researchId).then(res=>{
        if(res !== null) return Research.findOneAndUpdate({researchId: researchId}, {name: newName, researchId: crypto.randomBytes(20).toString('hex')}).exec();
        else return Promise.reject("Research with that name doesn't exist");
    });
}

function deleteAllResearchData(researchId) {
    return Research.findOne({researchId: researchId}).exec().then(res => {
        if(res == null) throw new Error("Research not found");
        res.data = [];
        return res.save();
    });
}

function deleteResearch(researchId){
    return Research.findOneAndDelete({researchId: researchId}).exec().then(val=> {
        if(val == null) throw new Error("Research not found");
        else Promise.resolve();
    });
}

function deleteAllResearches() {
    return Research.deleteMany({}).exec();
}

module.exports = {
    init, getUserCount, getUsers, userExists, findUser, verifyUser, insertUser, updateUser, deleteUser, 
    getResearches, insertResearch, findResearchById, findResearchByName, researchExistsById, researchExistsByName, 
    insertResearchData, renameResearch, insertResearchers, deleteResearcher, deleteAllResearchData, deleteAllResearches, deleteResearch
};