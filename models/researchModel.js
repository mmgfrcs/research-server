let mongoose = require("mongoose");

let researchSchema = new mongoose.Schema({
    "name": String,
    "researchId": String,
    "researchers": [String],
    "data": [Object]
});

module.exports = mongoose.model("Research", researchSchema);