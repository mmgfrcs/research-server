process.env.NODE_ENV = 'test';
let chai = require("chai");
let chaiHttp = require('chai-http');
let chaiPromise = require('chai-as-promised');
let expect = chai.expect;
// eslint-disable-next-line no-unused-vars
let should = chai.should();
let server = require("../app");
let db = require("../src/db");

chai.use(chaiHttp);
chai.use(chaiPromise);

before(function (done) {
    setTimeout(function(){
        done();
    }, 500);
});

describe("Database", function() {
    it("Can find all users", async function() {
        
        expect(db.findUser()).to.be.instanceOf(Array).with.length(1);
    });
    it("Can find user given correct name", function() {
        expect(db.findUser("admin")).to.be.instanceOf(Object).with.property("name", "admin");
    });
    it("Cannot find user given wrong name", function() {
        expect(db.findUser("admn")).to.be.undefined;
    });
    it("Can verify user correct", function() {
        expect(db.findUser("admin", "password")).to.be.instanceOf(Object).with.property("name", "admin");
    });
    it("Can verify user wrong", function() {
        expect(db.findUser("admin", "pass")).to.be.undefined;
    });
    it("Can insert user with pre-generated token and admin position", async function() {
        await db.insertUser("testUser2", "testuser", true, true);
        expect(db.findUser("testUser2")).to.be.instanceOf(Object).with.property("name", "testUser2");
        expect(db.findUser("testUser2")).to.have.property("token").not.equal("");
        expect(db.findUser("testUser2")).to.have.property("secret").not.equal("");
        expect(db.findUser("testUser2")).to.have.property("permission").equal(2);
    });
    it("Cannot insert duplicate data", async function() {
        db.insertUser("testUser2", "testuser", true, true).should.be.rejected;
    });
    it("Can delete user", async function() {
        db.deleteUser("testUser2");
        expect(db.getUserCount()).eq(1);
    });
});

describe("App", function() {
    it("Should respond", function(done) {
        chai.request(server.app).get("/").end((err, res) => {
            if(err) done(err);
            //expect(res).to.have.cookie("connect.sid");
            expect(res).to.have.status(200);
            done();
        });
    });
    it("Should login", function(done) {
        let agent = chai.request.agent(server.app);
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
        let agent = chai.request.agent(server.app);
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
        chai.request(server.app).get("/logout").end((err, res) => {
            if(err) return done(err);
            expect(res).to.have.status(200);
            done();
        });
    });
    it("Should not generate token without user", function(done) {
        chai.request(server.app).get("/generate").end((err, res) => {
            if(err) return done(err);
            expect(res).to.have.status(400);
            done();
        });
    });
});