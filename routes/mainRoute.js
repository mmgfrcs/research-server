const express = require("express");
const passport = require("passport");
const db = require("../src/db");
const session = require("express-session");
const flash = require("express-flash");
const LocalStrategy = require("passport-local").Strategy;
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { check, validationResult } = require('express-validator');
const logger = require("../src/logger");
const config = require("../src/configLoader");

let router = express.Router();

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

router.get("/", async (req, res) => {
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
});

router.post("/login", [
    check("username").escape(),
    check("password").escape()
], passport.authenticate('local', {failureRedirect: "/", failureFlash: true}), (req, res) => {
    res.redirect("/");
});

router.get("/logout", (req, res) => {
    req.logout();
    res.redirect("/");
});

router.get("/generate", (req, res) => {
    if(req.user) {
        let sec = crypto.randomBytes(20).toString('hex');
        let token = jwt.sign(req.user.name, sec);
        db.updateUser(req.user.name, {token: token, secret: sec});
        res.redirect("/");
    }
    else res.status(400).render("/");
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
router.get("/research/:researchId", async (req, res) => {
    let research = await db.findResearchById(req.params.researchId);
    if(research.researchers.includes(req.user.name) || req.user.permission > 0) {
        res.render("research", {
            title: config.serverName,
            researchObj: research
        });
    }
    else {
        res.status(403).render("error", {
            errorCode: "403",
            errorMessage: "Forbidden",
            message: "You don't have enough permission to view this research."
        });
    }
});

//Rename Research
router.post("/research/:researchId/rename",[
    check("name").isLength({min: 4}).escape(), 
    validateInput,
    checkPermsAndRedirect(async (req) => {
        let research = await db.findResearchById(req.params.researchId);
        return research.researchers.includes(req.user.name) || req.user.permission > 0;
    })
], async (req, res) => {
    await db.renameResearch(req.params.researchId, req.body.name);
    res.render("/");
});

//Add Researcher to Research
router.post("/research/:researchId/researcher",[
    check("name").escape(), 
    checkPermsAndFlash(async (req) => {
        let research = await db.findResearchById(req.params.researchId);
        return research.researchers.includes(req.user.name) || req.user.permission > 0;
    })
], async (req, res) => {
    await db.insertResearchers(req.params.researchId, [req.body.name]);
    res.render("/");
});

//Remove Researcher from Research
router.post("/research/:researchId/researcher/delete",[
    check("name").escape(), 
    checkPermsAndFlash(async (req) => {
        let research = await db.findResearchById(req.params.researchId);
        return research.researchers.includes(req.user.name) || req.user.permission > 0;
    })
], async (req, res) => {
    await db.deleteResearcher(req.params.researchId, [req.body.name]);
    res.render("/");
});

//Remove Research
router.post("/research/:researchId/delete",[
    checkPermsAndFlash(async (req) => {
        let research = await db.findResearchById(req.params.researchId);
        return research.researchers.includes(req.user.name) || req.user.permission > 0;
    })
], async (req, res) => {
    await db.deleteResearcher(req.params.researchId, [req.body.name]);
    res.render("/");
});

//New researcher
router.post("/researcher", [
    check("name").isLength({min: 4}).escape(),
    check("password").isLength({min: 6}).escape(),
    check("permLvl").isInt({min: 0, max: 2})
], validateInput, checkPermsAndFlash((req) => req.user.permission != 2), async (req, res) => {
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

router.use((err, req, res, next) => {
    if(err.status) next(err);
});

function validateInput(req, res, next) {
    let errors = validationResult(req);
    if(!errors.isEmpty()) {
        req.flash("error", "Validation failed");
        res.redirect("/");
    }
    else next();
}

function checkPermsAndRedirect(permFunc) {
    return function(req, res, next) {
        if(!permFunc(req)) {
            res.status(403).render("error", {
                errorCode: "403",
                errorMessage: "Forbidden",
                message: "You don't have enough permission to view this research."
            });
        }
        else next();
    };
}

function checkPermsAndFlash(permFunc) {
    return function(req, res, next) {
        if(!permFunc(req)) {
            req.flash("error","Not enough permisson to do this action");
            res.render("/");
        }
        else next();
    };
}

module.exports = router;