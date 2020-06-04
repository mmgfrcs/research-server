const yaml = require("yaml");
const fs = require("fs");

const file = fs.readFileSync('./config/config.yml', 'utf8');
module.exports = yaml.parse(file);