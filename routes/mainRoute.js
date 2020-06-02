let express = require("express");
let yaml = require("yaml");
let fs = require("fs");
let passport = require("passport");
let db = require("../src/db");
let session = require("express-session");
let flash = require("express-flash");
let LocalStrategy = require("passport-local").Strategy;
let jwt = require("jsonwebtoken");
let crypto = require("crypto");

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
    if(desUser !== undefined) {
        cb(null, desUser);
    }
    else {
        cb(null, false);
    }
});

router.use(session({ secret: 'res-srv', resave: true, saveUninitialized: false }));
router.use(passport.initialize());
router.use(passport.session());
router.use(flash());

//Get config
const file = fs.readFileSync('./config/config.yml', 'utf8')
config = yaml.parse(file);

router.use(express.static("public"));

router.get("/", (req, res) => {
    res.render("index", {
        title: config.serverName,
        firstStart: db.getUserCount > 0,
        user: req.user,
        loginFail: req.query.login || false
    });
})

router.post("/login", passport.authenticate('local', {failureRedirect: "/", failureFlash: true}), (req, res) => {
    res.redirect("/");
})

router.get("/logout", (req, res) => {
    req.logout();
    res.redirect("/");
});

router.get("/generate", (req, res) => {
    if(req.user) {
        let id = crypto.randomBytes(16).toString('hex');
        let sec = jwt.sign(req.user.name, id);
        db.updateUser(req.user.name, {clientId: id, clientSecret: sec});
        res.redirect("/");
    }
    else res.sendStatus(400);
})

module.exports = router;