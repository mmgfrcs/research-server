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

let tokenAdmin = "";
let secretAdmin = "";

before(function (done) {
    this.timeout(5000);
    db.insertUser("testUserApiAdmin", "tuadmin", true, true).then(doc => {
        tokenAdmin = doc.token;
        secretAdmin = doc.secret;
        db.findUser({name: "testUserApiAdmin"}).then(user=> {
            tokenAdmin = user.token;
            secretAdmin = user.secret;
            setTimeout(function(){
                done();
            }, 1000);
        });

    });
});

describe("Research API (/api/research)", function() {
    it("GET / should fail with 401 without auth", function (done) {
        chai.request(server).get("/api/research").end((err, res) => {
            if(err) done(err);
            //expect(res).to.have.cookie("connect.sid");
            expect(res).to.have.status(401);
            done();
        });
    });
    it("GET / should fail with 400 with auth but without token", function (done) {
        chai.request(server).get("/api/research").auth(secretAdmin, {type: "bearer"}).end((err, res) => {
            if(err) done(err);
            //expect(res).to.have.cookie("connect.sid");
            expect(res).to.have.status(400);
            done();
        });
    });
    it("GET / should fail with 400 with auth and wrong token", function (done) {
        chai.request(server).get("/api/research").auth(secretAdmin, {type: "bearer"}).send({"token": tokenAdmin + "a"}).end((err, res) => {
            if(err) done(err);
            //expect(res).to.have.cookie("connect.sid");
            expect(res).to.have.status(400);
            done();
        });
    });
    it("GET / should succeed with 200 with correct auth and token", function (done) {
        chai.request(server).get("/api/research").auth(secretAdmin, {type: "bearer"}).send({"token": tokenAdmin}).end((err, res) => {
            if(err) done(err);
            //expect(res).to.have.cookie("connect.sid");
            expect(res).to.have.status(200);
            expect(res.body).to.be.an.instanceOf(Array);
            done();
        });
    });
    it("POST / should fail with 401 without auth", function (done) {
        chai.request(server).post("/api/research").end((err, res) => {
            if(err) done(err);
            //expect(res).to.have.cookie("connect.sid");
            expect(res).to.have.status(401);
            done();
        });
    });
    it("POST / should fail with 400 without body", function (done) {
        chai.request(server).post("/api/research").auth(secretAdmin, {type: "bearer"}).send({"token": tokenAdmin}).end((err, res) => {
            if(err) done(err);
            //expect(res).to.have.cookie("connect.sid");
            expect(res).to.have.status(400);
            done();
        });
    });
    it("POST / should fail with 200 with name in body", function (done) {
        chai.request(server).post("/api/research").auth(secretAdmin, {type: "bearer"}).send({"token": tokenAdmin, "name": "research10"}).end((err, res) => {
            if(err) done(err);
            //expect(res).to.have.cookie("connect.sid");
            expect(res).to.have.status(400);
            done();
        });
    });
});

describe("Specific Research API (/api/research/:researchId)", function() {
    it("GET /api/research/:researchId should fail with 401 without auth");
    it("GET /api/research/:researchId should fail with 403 without enough permission");
    it("GET /api/research/:researchId should succeed with 200 without enough permission but member of research");
    it("GET /api/research/:researchId should succeed with 200 with enough permission");
    it("GET /api/research/:researchId should fail with 400 with wrong ID");
});

after(function () {
    return db.deleteUser("testUserApiAdmin");
});