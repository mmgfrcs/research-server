//const config = require('./configLoader');
const axios = require('axios').default;

//console.log(config);

axios.post("https://api.github.com/repos/:owner/:repo/check-runs", {

}, {
    headers: [
        {"Accept": "application/vnd.github.antiope-preview+json"},
        {"Content-Type": "application/json"}
    ]
});