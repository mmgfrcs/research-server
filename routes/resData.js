let express = require("express");

let router = express.Router();

router.get("/:clientId?", (req, res) => {
    res.send("Hello!" + JSON.stringify(req.body));
});

module.exports = router;