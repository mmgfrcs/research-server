//Dependents
let express = require("express");
let bodyparser = require("body-parser");
let helmet = require("helmet");
let cors = require("cors");
let path = require("path");

//Routes and Scripts
let db = require("./src/db");
//let resData = require("./routes/resData");
let researchers = require("./routes/researchers");
let mainRoute = require("./routes/mainRoute");

//Configure
db.init();
let app = express();
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
let username = "admin";
let userpass = "password";
db.insertUser(username, userpass, true, true);
console.log("First Startup: User " + username + ", password " + userpass);

//Use dependents
app.use(helmet({hsts: {maxAge: 900}}));
app.use(bodyparser.json());
app.use(bodyparser.urlencoded({extended: true}));
app.use(cors());

//app.use("/api/data", resData);
app.use("/api/researcher", researchers);
app.use("/", mainRoute);

app.listen(3000, () => {
    console.log("Server started");
});

module.exports = {app: app, db: db};