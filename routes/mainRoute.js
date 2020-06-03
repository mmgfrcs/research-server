const express = require("express");
const yaml = require("yaml");
const fs = require("fs");
const passport = require("passport");
const db = require("../src/db");
const session = require("express-session");
const flash = require("express-flash");
const LocalStrategy = require("passport-local").Strategy;
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { check, validationResult } = require('express-validator');

let router = express.Router();
let config = undefined;


passport.use(new LocalStrategy(function(username, pass, done) {
    let verify = db.findUser(username, pass);
    if(verify !== undefined) {
        console.log("Login " + username + " success");
        //Success
        return done(null, verify);
    }
    else {
        console.log("Login " + username + " failed");
        return done(null, false, {message: "Wrong username or password."});
    }
}));

passport.serializeUser(function(user, cb) {
    cb(null, user.name);
});

passport.deserializeUser(function(id, cb) {
    let desUser = db.findUser(id);
    cb(null, desUser);

});

router.use(session({ secret: 'res-srv', resave: true, saveUninitialized: false }));
router.use(passport.initialize());
router.use(passport.session());
router.use(flash());

//Get config
const file = fs.readFileSync('./config/config.yml', 'utf8');
config = yaml.parse(file);

router.use(express.static("public"));

router.get("/", (req, res) => {
    let researches = [];
    if(req.user !== undefined && req.user.permission > 0) researches = db.getResearches();
    else researches = db.getResearches().filter(val => val.name == req.user.name);
    res.render("index", {
        title: config.serverName,
        firstStart: db.getUserCount > 0,
        user: req.user,
        userList: db.getUsers(req.user),
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
            console.error(err);
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
            console.error(err);
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
        researchObj: db.findResearch(req.query.researchId)
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