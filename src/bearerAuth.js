const express = require("express");
const db = require("../src/db");
const flash = require("express-flash");
const passport = require("passport");
const logger = require("../src/logger");
const BearerStrategy = require("passport-http-bearer").Strategy;


module.exports = function () {
    let router = express.Router();

    passport.use(new BearerStrategy({realm: "research"},(secret, done) => {
        db.verifyUser(secret).then(verified=>{        
            if(verified) return db.findUser({secret: secret});
            else return Promise.resolve(false);
            
        }).then(user=> {
            if(user == false) return done(null, user, {message: "Wrong secret."});
            else return done(null, user);
        }).catch(err=> {
            logger.error(err);
        });
    }));
    
    router.use(passport.initialize());
    router.use(flash());

    return router;
};