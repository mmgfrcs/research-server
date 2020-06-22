let mongoose = require("mongoose");

let researcherSchema = new mongoose.Schema({
    "name": String,
    "password": String,
    "token": String,
    "secret": String,
    "permission": Number
});

module.exports = mongoose.model("Researcher", researcherSchema);