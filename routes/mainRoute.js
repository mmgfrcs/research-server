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

router.post("/researcher", [
    check("name").isLength({min: 4}).escape(),
    check("password").isLength({min: 6}).escape(),
    check("permLvl").isInt({min: 0, max: 2})
], async (req, res) => {
    let errors = validationResult(req);
    if(!req.user) req.flash("error","Not logged in. Please login to continue");
    else if (req.user.permission != 2) req.flash("error","Not enough permisson to do this action");
    else if(!errors.isEmpty()) req.flash("error", "Input error. Make sure that the name is at least 4 characters long and the password is at least 6 characters long.");
    else {
        try {
            await db.insertUser(req.body.name, req.body.password, req.body.tokengen || false, req.body.permLvl == 2);
            if(req.body.permLvl == 1) db.updateUser(req.body.name, {permission: 1});
            req.flash("success","Researcher added");
        }
        catch(err) {
            logger.error(err);
            req.flash("error", "Error in adding researcher: " + err.message);
        }
    }
    res.redirect('/');
});

router.post("/research", [
    check("name").isLength({min: 4}).escape()
], async (req, res) => {
    let errors = validationResult(req);
    if(!req.user) req.flash("error","Not logged in. Please login to continue");
    else if(!errors.isEmpty()) req.flash("error", "Input error. Make sure that the name is at least 4 characters long.");
    else {
        try {
            await db.insertResearch(req.body.name, req.user.name);
            req.flash("success","Research added");
        }
        catch(err) {
            logger.error(err);
            req.flash("error", "Error in adding research: " + err.message);
        }
    }
    res.redirect('/');
});

router.get("/research/:researchId", (req, res) => {
    if(!req.user) {
        req.flash("error","Not logged in. Please login to continue");
        return res.redirect("/");
    }
    res.render("research", {
        title: config.serverName,
        researchObj: db.findResearch(req.params.researchId)
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
    else res.sendStatus(400);
});


module.exports = router;