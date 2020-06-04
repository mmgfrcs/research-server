process.env.NODE_ENV = 'test';
let chai = require("chai");
let chaiHttp = require('chai-http');
let chaiPromise = require('chai-as-promised');
let expect = chai.expect;
// eslint-disable-next-line no-unused-vars
let should = chai.should();
let server = require("../app");

chai.use(chaiHttp);
chai.use(chaiPromise);

before(function (done) {
    this.timeout(4000);
    setTimeout(function(){
        done();
    }, 3000);
});

describe("App", function() {
    it("Should respond", function(done) {
        chai.request(server).get("/").end((err, res) => {
            if(err) done(err);
            //expect(res).to.have.cookie("connect.sid");
            expect(res).to.have.status(200);
            done();
        });
    });
    it("Should login", function(done) {
        let agent = chai.request.agent(server);
        agent.post("/login").send({"username": "admin", "password": "password"}).end((err, res) => {
            if(err) return done(err);
            //expect(res).to.have.cookie("connect.sid");
            expect(res).to.have.status(200);
            expect(res.text).to.contain("Welcome, admin");
            agent.close();
            done();
        });
    });
    it("Should not login", function(done) {
        let agent = chai.request.agent(server);
        agent.post("/login").send({"username": "admin", "password": "a"}).end((err, res) => {
            if(err) return done(err);
            //expect(res).to.have.cookie("connect.sid");
            expect(res).to.have.status(200);
            expect(res.text).to.not.contain("Welcome, admin");
            agent.close();
            done();
        });
    });
    it("Should logout", function(done) {
        chai.request(server).get("/logout").end((err, res) => {
            if(err) return done(err);
            expect(res).to.have.status(200);
            done();
        });
    });
    it("Should not generate token without user", function(done) {
        chai.request(server).get("/generate").end((err, res) => {
            if(err) return done(err);
            expect(res).to.have.status(400);
            done();
        });
    });
});