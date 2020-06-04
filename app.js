//Load env vars
require("dotenv").config();
//Dependents
const express = require("express");
const bodyparser = require("body-parser");
const helmet = require("helmet");
const cors = require("cors");
const path = require("path");
const logger = require("./src/logger");

//Routes and Scripts
const db = require("./src/db");
let resData = require("./routes/resData");
//const researchers = require("./routes/researchers");
const mainRoute = require("./routes/mainRoute");

//Configure

let app = express();
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
db.init().then(() => {
    let username = "admin";
    let userpass = "password";
    db.getUserCount().then((userCount) => {
        if(userCount == 0) return db.insertUser(username, userpass, true, true);
        else return Promise.resolve(null);
    }).then((val) => {
        if(val !== null) logger.info("First Startup: User " + username + ", password " + userpass);
        app.listen(3000, () => {
            logger.info("Server started");
        });
    });
});

//Use dependents
app.use(helmet({hsts: {maxAge: 900}}));
app.use(bodyparser.json());
app.use(bodyparser.urlencoded({extended: true}));
app.use(cors());

app.use("/api/research", resData);
//app.use("/api/researcher", researchers);
app.use("/", mainRoute);

module.exports = app;