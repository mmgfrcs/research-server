const express = require("express");
const db = require("../src/db");
const session = require("express-session");
const flash = require("express-flash");
const passport = require("passport");
const BearerStrategy = require("passport-http-bearer").Strategy;
const config = require("../src/configLoader");

let router = express.Router();

passport.use(new BearerStrategy((token, done) => {

}));

router.use(session({ secret: 'res-srv', resave: true, saveUninitialized: false }));
router.use(passport.initialize());
router.use(passport.session());
router.use(flash());

router.get("/:researchId?", (req, res) => {
    if(!req.body.token) return res.status(400).send({"error": "Token is required."});
    let callingUser = db.findUser().find(x=>x.token == req.body.token);
    if(callingUser === undefined) return res.status(400).send({"error": "Invalid token."});

    res.render("research", {
        title: config.serverName,
        researchObj: db.findResearch(req.params.researchId)
    });
});

module.exports = router;