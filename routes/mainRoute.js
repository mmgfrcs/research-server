const express = require("express");
const passport = require("passport");
const db = require("../src/db");
const session = require("express-session");
const flash = require("express-flash");
const LocalStrategy = require("passport-local").Strategy;
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const asyncWrap = require("async-middleware").wrap;
const { check, validationResult } = require('express-validator');
const excel = require("excel4node");
const logger = require("../src/logger");
const config = require("../src/configLoader");
const httpErrors = require("../resources/httpErrors.json");

let router = express.Router();

function checkKeys(dataObj, prefix) {
    prefix = prefix || "";
    return [...new Set(dataObj.map(val => { 
        let arr = [];
        for(let key in val) {
            if(typeof val[key] === "object") arr.push(checkKeys([val[key]], `${prefix}${key}.`));
            else arr.push(`${prefix}${key}`);
        } 
        return arr;
    }).flat(Infinity))];
}

function byString(obj, str) {
    str = str.replace(/\[(\w+)\]/g, '.$1'); // convert indexes to properties
    str = str.replace(/^\./, '');           // strip a leading dot
    var a = str.split('.');
    for (var i = 0, n = a.length; i < n; ++i) {
        var k = a[i];
        if (k in obj) 
            obj = obj[k];
        else return;
    }
    return obj;
}

/**
 * 
 * @param {string} in_camelCaseString 
 */
function camelCaseToTitleCase(in_camelCaseString) {
    var result = in_camelCaseString                         // "ToGetYourGEDInTimeASongAboutThe26ABCsIsOfTheEssenceButAPersonalIDCardForUser456InRoom26AContainingABC26TimesIsNotAsEasyAs123ForC3POOrR2D2Or2R2D"
        .replace(/([a-z])([A-Z][a-z])/g, "$1 $2")           // "To Get YourGEDIn TimeASong About The26ABCs IsOf The Essence ButAPersonalIDCard For User456In Room26AContainingABC26Times IsNot AsEasy As123ForC3POOrR2D2Or2R2D"
        .replace(/([A-Z][a-z])([A-Z])/g, "$1 $2")           // "To Get YourGEDIn TimeASong About The26ABCs Is Of The Essence ButAPersonalIDCard For User456In Room26AContainingABC26Times Is Not As Easy As123ForC3POOr R2D2Or2R2D"
        .replace(/([a-z])([A-Z]+[a-z])/g, "$1 $2")          // "To Get Your GEDIn Time ASong About The26ABCs Is Of The Essence But APersonal IDCard For User456In Room26AContainingABC26Times Is Not As Easy As123ForC3POOr R2D2Or2R2D"
        .replace(/([A-Z]+)([A-Z][a-z][a-z])/g, "$1 $2")     // "To Get Your GEDIn Time A Song About The26ABCs Is Of The Essence But A Personal ID Card For User456In Room26A ContainingABC26Times Is Not As Easy As123ForC3POOr R2D2Or2R2D"
        .replace(/([a-z]+)([A-Z0-9]+)/g, "$1 $2")           // "To Get Your GEDIn Time A Song About The 26ABCs Is Of The Essence But A Personal ID Card For User 456In Room 26A Containing ABC26Times Is Not As Easy As 123For C3POOr R2D2Or 2R2D"
        
        // Note: the next regex includes a special case to exclude plurals of acronyms, e.g. "ABCs"
        .replace(/([A-Z]+)([A-Z][a-rt-z][a-z]*)/g, "$1 $2") // "To Get Your GED In Time A Song About The 26ABCs Is Of The Essence But A Personal ID Card For User 456In Room 26A Containing ABC26Times Is Not As Easy As 123For C3PO Or R2D2Or 2R2D"
        .replace(/([0-9])([A-Z][a-z]+)/g, "$1 $2")          // "To Get Your GED In Time A Song About The 26ABCs Is Of The Essence But A Personal ID Card For User 456In Room 26A Containing ABC 26Times Is Not As Easy As 123For C3PO Or R2D2Or 2R2D"  

        // Note: the next two regexes use {2,} instead of + to add space on phrases like Room26A and 26ABCs but not on phrases like R2D2 and C3PO"
        .replace(/([A-Z]{2,})([0-9]{2,})/g, "$1 $2")        // "To Get Your GED In Time A Song About The 26ABCs Is Of The Essence But A Personal ID Card For User 456 In Room 26A Containing ABC 26 Times Is Not As Easy As 123 For C3PO Or R2D2 Or 2R2D"
        .replace(/([0-9]{2,})([A-Z]{2,})/g, "$1 $2")        // "To Get Your GED In Time A Song About The 26 ABCs Is Of The Essence But A Personal ID Card For User 456 In Room 26A Containing ABC 26 Times Is Not As Easy As 123 For C3PO Or R2D2 Or 2R2D"
        .trim();


    // capitalize the first letter
    return result.charAt(0).toUpperCase() + result.slice(1);
}

passport.use(new LocalStrategy(function(username, pass, done) {
    db.verifyUser(username, pass).then((verified) => {
        if(verified) {
            logger.info("Login attempt for " + username + " succeeded");
            //Success
            return db.findUser({name: username});
        }
        else {
            logger.info("Login attempt for " + username + " failed");
            return Promise.resolve(false);
        }
    }).then(user=> {
        if(user == false) return done(null, user, {message: "Wrong username or password."});
        else return done(null, user);
    }).catch(err=> {
        logger.info("Login attempt for " + username + " failed");
        done(err, false, {message: "Wrong username or password."});
    });

}));

passport.serializeUser(function(user, cb) {
    cb(null, user.name);
});

passport.deserializeUser(function(id, cb) {
    db.findUser({name: id}).then(user=>{
        cb(null, user);
    });
});

router.use(session({ secret: 'res-srv', resave: true, saveUninitialized: false }));
router.use(passport.initialize());
router.use(passport.session());
router.use(flash());

router.use(express.static("public"));

router.get("/", asyncWrap(async (req, res) => {
    let researches = [];
    if(req.user !== undefined) {
        if(req.user.permission > 0) researches = await db.getResearches();
        else researches = (await db.getResearches()).filter(val => val.name == req.user.name);
    }
    res.render("index", {
        title: config.serverName,
        firstStart: await db.getUserCount() > 0,
        user: req.user,
        userList: await db.getUsers(req.user),
        researches: researches,
        loginFail: req.query.login || false
    });
}));

router.post("/login", [
    check("username").escape(),
    check("password").escape()
], passport.authenticate('local', {failureRedirect: "/", failureFlash: true}), (req, res) => {
    res.redirect("/");
});

router.get("/logout", (req, res) => {
    logger.info(req.user.name + " logged out");
    req.logout();
    res.redirect("/");
});

router.get("/generate", (req, res) => {
    if(req.user) {
        logger.info(`Generated token for ${req.user.name}`);
        let sec = crypto.randomBytes(20).toString('hex');
        let token = jwt.sign(req.user.name, sec);
        db.updateUser(req.user.name, {token: token, secret: sec});
        res.redirect("/");
    }
    else res.sendStatus(400);
});

//All middlewares below requires login
router.use((req, res, next) => {
    if(!req.user) {
        req.flash("error","Not logged in. Please login to continue");
        res.redirect("/");
    }
    else next();
});

//Get research details
router.get("/research/:researchId", asyncWrap(async (req, res) => {
    let research = await db.findResearchById(req.params.researchId);
    if(research.researchers.includes(req.user.name) || req.user.permission > 0) {
        res.render("research", {
            title: config.serverName,
            researchObj: research,
            checkKeys,
            byString 
        });
    }
    else {
        res.status(403).render("error", {
            errorCode: "403",
            errorMessage: "Forbidden",
            message: "You don't have enough permission to view this research."
        });
    }
}));

//Export research details
router.get("/research/:researchId/export", asyncWrap(async (req, res) => {
    let research = await db.findResearchById(req.params.researchId);
    if(research.researchers.includes(req.user.name) || req.user.permission > 0) {
        let keys = checkKeys(research.data);
        let researchData = req.query.q ? research.data.filter(x=>{
            logger.debug(`Export: ${keys[0]} ${byString(x, keys[0])} = ${byString(x, keys[0]).toLowerCase().includes(req.query.q)}`);
            return byString(x, keys[0]).toLowerCase().includes(req.query.q);
        }) : research.data;
        logger.info(`Exporting ${research.name}: Query ${req.query.q} vs ${keys[0]} => ${researchData.length}/${research.data.length} entries`);

        keys = checkKeys(researchData);

        let wb = new excel.Workbook();
        let ws = wb.addWorksheet(research.name);

        let row = 2, col = 1;
        for(let key of keys) {
            ws.cell(1, col).string(camelCaseToTitleCase(key));
            col++;
        }

        for(let val of researchData) { 
            col = 1;
            for(let key of keys) {
                let keyVal = byString(val, key);
                if (keyVal !== undefined) {
                    if (typeof keyVal === "number") 
                        ws.cell(row, col).number(keyVal);
                    else ws.cell(row, col).string(keyVal.toString());
                }
                col++;
            }
            row++;
        }

        wb.write(`${research.name}.xlsx`, res);
    }
    else {
        res.status(403).render("error", {
            errorCode: "403",
            errorMessage: "Forbidden",
            message: "You don't have enough permission to view this research."
        });
    }
}));

//Remove Researcher (temporary)
router.post("/researcher/:name",[
    check("name").escape(), 
    checkPermsAndFlash(async (req) => {
        return req.user.permission == 2;
    })
], asyncWrap(async (req, res) => {
    await db.deleteUser(req.params.name);
    res.redirect("/");
}));

//New researcher
router.post("/researcher", [
    check("name").isLength({min: 4}).escape(),
    check("password").isLength({min: 6}).escape(),
    check("permLvl").isInt({min: 0, max: 2})
], validateInput, checkPermsAndFlash((req) => req.user.permission == 2), async (req, res) => {
    try {
        await db.insertUser(req.body.name, req.body.password, req.body.tokengen || false, req.body.permLvl == 2);
        if(req.body.permLvl == 1) await db.updateUser(req.body.name, {permission: 1});
        req.flash("success","Researcher added");
    }
    catch(err) {
        logger.error(err);
        req.flash("error", "Error in adding researcher: " + err.message);
    }
    res.redirect('/');
});

//New research
router.post("/research", [
    check("name").isLength({min: 4}).escape(), 
    validateInput
], async (req, res) => {
    try {
        await db.insertResearch(req.body.name, req.user.name);
        req.flash("success","Research added");
    }
    catch(err) {
        logger.error(err);
        req.flash("error", "Error in adding research: " + err.message);
    }
    
    res.redirect('/');
});

// eslint-disable-next-line no-unused-vars
router.use((err, req, res, _next) => {
    let httpError = httpErrors.find(x=>x.code === err.status);
    if(err.status) {
        if(httpError) {
            res.status(err.status).render("error", {
                errorCode: httpError.code,
                errorMessage: httpError.description,
                message: httpError.message
            });
        }
        else {
            res.status(err.status).render("error", {
                errorCode: err.status,
                errorMessage: "",
                message: ""
            });
        }
    }
    else {
        res.status(400).render("error", {
            errorCode: "Error",
            errorMessage: err.message,
            message: process.env.NODE_ENV == "development" ? err.stack : ""
        });
    }
});

function validateInput(req, res, next) {
    let errors = validationResult(req);
    if(!errors.isEmpty()) {
        req.flash("error", "Validation failed");
        res.redirect("/");
    }
    else next();
}

function checkPermsAndFlash(permFunc) {
    return function(req, res, next) {
        try {
            if(!permFunc(req)) {
                req.flash("error","Not enough permisson to do this action");
                res.redirect("/");
            }
            else next();
        } catch (err) {
            next(err);
        }
    };
}

module.exports = router;