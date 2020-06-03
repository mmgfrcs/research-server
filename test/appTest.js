process.env.NODE_ENV = 'test';
let chai = require("chai");
let chaiHttp = require('chai-http');
let expect = chai.expect;
let server = require("../app");

chai.use(chaiHttp);

describe("App", function() {
    it("Should respond", function(done) {
        chai.request(server).get("/").end((err, res) => {
            if(err) done(err);
            expect(res).to.have.status(200);
            done();
        });
    });
});