process.env.NODE_ENV = 'test';
let chai = require("chai");
let chaiHttp = require('chai-http');
let chaiPromise = require('chai-as-promised');
let expect = chai.expect;
// eslint-disable-next-line no-unused-vars
let should = chai.should();
let server = require("../app");
process.env.MONGODB_URI = process.env.MONGODB_URI_TEST;

chai.use(chaiHttp);
chai.use(chaiPromise);

before(function (done) {
    this.timeout(4000);
    setTimeout(function(){
        done();
    }, 1000);
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
    it("Should not login: Wrong password", function(done) {
        chai.request(server).post("/login").send({"username": "admin", "password": "a"}).end((err, res) => {
            if(err) return done(err);
            //expect(res).to.have.cookie("connect.sid");
            expect(res).to.have.status(400);
            expect(res.text).to.not.contain("Welcome, admin");
            done();
        });
    });
    it("Should not login: Wrong username", function(done) {
        chai.request(server).post("/login").send({"username": "a", "password": "password"}).end((err, res) => {
            if(err) return done(err);
            //expect(res).to.have.cookie("connect.sid");
            expect(res).to.have.status(400);
            expect(res.text).to.not.contain("Welcome, admin");
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
    let agent = chai.request.agent(server);
    it("Should login", function(done) {
        agent.post("/login").send({"username": "admin", "password": "password"}).end((err, res) => {
            if(err) return done(err);
            //expect(res).to.have.cookie("connect.sid");
            expect(res).to.have.status(200);
            expect(res.text).to.contain("Welcome, admin");
            done();
        });
    });
    it("Should be able to add new research", function(done) {
        agent.post("/research").send({"name": "Research1"}).end((err, res) => {
            if(err) return done(err);
            expect(res.text).to.contain("Research1");
            done();
        });
    });
    it("Should be able to add new researcher", function(done) {
        agent.post("/researcher").send({"name": "ResearcherUser", "password": "password", "permLvl": 0, "tokengen": true}).end((err, res) => {
            if(err) return done(err);
            expect(res.text).to.contain("ResearcherUser");
            done();
        });
    });
    it("Should be able to handle errors in research ID (/research/[id])", function(done) {
        agent.get("/research/id").end((err, res) => {
            if(err) return done(err);
            expect(res.text).to.have.status(400);
            done();
        });
    });
    it("Should be able to handle errors in research ID (/research/[id]/researcher)", function(done) {
        agent.get("/research/id/researcher").send({name: "AAAAAAA"}).end((err, res) => {
            if(err) return done(err);
            expect(res.text).to.have.status(400);
            done();
        });
    });
});