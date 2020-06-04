const express = require("express");
const db = require("../src/db");
const session = require("express-session");
const flash = require("express-flash");
const jwt = require("jsonwebtoken");
const passport = require("passport");
const BearerStrategy = require("passport-http-bearer").Strategy;
//const config = require("../src/configLoader");

let router = express.Router();

passport.use(new BearerStrategy({realm: "research"},(secret, done) => {
    db.verifyUser(secret).then(verified=>{        
        if(verified) return db.findUser({secret: secret});
        else return Promise.resolve(false);
        
    }).then(user=> {
        if(user == false) return done(null, user, {message: "Wrong secret."});
        else return done(null, user);
    });
}));

router.use(session({ secret: 'res-srv', resave: true, saveUninitialized: false }));
router.use(passport.initialize());
router.use(passport.session());
router.use(flash());

router.get("/:researchId?", passport.authenticate('bearer'), (req, res) => {
    if(!req.body.token) return res.status(400).send({"error": "Token is required."});
    db.findUser({token: req.body.token}).then(user=> {
        if(user !== null && jwt.verify(req.body.token, user.secret) == user.name) {
            //Verified
            db.findResearchById(req.params.researchId).then(result=> {
                res.send(result);
            }).catch(() => {
                res.status(404).send({"error": "Research ID not found"});
            });
        }
        else { //Failed verification
            return res.status(400).send({"error": "Invalid token."});
        }
    });
});

module.exports = router;