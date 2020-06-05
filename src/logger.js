let bunyan = require("bunyan");
let config = require("./configLoader");

let logger = bunyan.createLogger({name: config.serverName, level: "info"});
if (process.env.NODE_ENV === "test") logger.level(bunyan.FATAL + 1);
module.exports = logger;