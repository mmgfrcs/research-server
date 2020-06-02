let express = require("express");
let yaml = require("yaml");
let fs = require("fs");

let router = express.Router();
let config = undefined;

router.use(express.static("public"));

router.all((_req, _res, next) => {
    if(config === undefined) {
        const file = fs.readFileSync('./config/config.yml', 'utf8')
        config = yaml.parse(file);
    }
    next();
})

router.get("/", (req, res) => {
    res.render("index", {title: config.serverName});
})

module.exports = router;