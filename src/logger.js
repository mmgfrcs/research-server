let bunyan = require("bunyan");
let config = require("./configLoader");

let logger = bunyan.createLogger({name: config.serverName, level: "info"});
module.exports = logger;