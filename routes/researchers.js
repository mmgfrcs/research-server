let express = require("express");
let db = require("../src/db");

let router = express.Router();

router.get("/", (req, res) => {
    res.send(JSON.stringify(db.findUser()));
})

module.exports = router;