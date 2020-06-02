let express = require("express");
let yaml = require("yaml");
let fs = require("fs");
let passport = require("passport");
let db = require("../src/db");

let router = express.Router();
let config = undefined;

router.use((_req, _res, next) => {
    if(config === undefined) {
        const file = fs.readFileSync('./config/config.yml', 'utf8')
        config = yaml.parse(file);
        if(config.preconfigure == true) {
            let username = new Date().toString();
            let userpass = "pass" + username;
            db.insertUser(username, userpass);
        }
    }
    next();
})

router.use(express.static("public"));

router.get("/", (req, res) => {
    res.render("index", {
        title: config.serverName,
        firstStart: db.getUserCount > 0,
        user: req.user
    });
})

module.exports = router;