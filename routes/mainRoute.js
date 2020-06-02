let express = require("express");
let yaml = require("yaml");
let fs = require("fs");
let passport = require("passport");
let db = require("../src/db");
let session = require("express-session");
let flash = require("express-flash");
let LocalStrategy = require("passport-local").Strategy;

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

router.use((_req, _res, next) => {
    if(config === undefined) {
        const file = fs.readFileSync('./config/config.yml', 'utf8')
        config = yaml.parse(file);
        if(config.preconfigure == true) {
            let username = Date.now();
            let userpass = "pass";
            db.insertUser(username, userpass);
            console.log("Preconfigure: User " + username + ", password " + userpass);
        }
    }
    next();
})

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

router.post("/logout", (req, res) => {
    req.logout();
    res.redirect("/");
});
module.exports = router;