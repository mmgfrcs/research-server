let bunyan = require("bunyan");
let config = require("./configLoader");

let logger = bunyan.createLogger({name: config.serverName, level: bunyan.DEBUG});
if (process.env.NODE_ENV === "test") logger.level(bunyan.FATAL + 1);
else if (process.env.NODE_ENV === "production") logger.level(bunyan.INFO);
module.exports = logger;