process.env.NODE_ENV = 'test';
let chai = require("chai");
let chaiHttp = require('chai-http');
let chaiPromise = require('chai-as-promised');
let expect = chai.expect;
// eslint-disable-next-line no-unused-vars
let should = chai.should();
let db = require("../src/db");

chai.use(chaiHttp);
chai.use(chaiPromise);

before(function (done) {
    setTimeout(function(){
        done();
    }, 1000);
});

describe("Database User Finder", function() {
    this.timeout(5000);
    it("Can find all users", function() {
        return db.getUsers().then((user) => {
            user.should.be.an.instanceOf(Array).with.lengthOf(1);
        });
    });
    it("Can find user given correct name", function() {
        return db.findUser({name: "admin"}).then((user) => {
            
            user.should.be.an.instanceOf(Object).with.a.property("name", "admin");
        });
    });
    it("Cannot find user given wrong name", function() {
        return db.findUser({name: "admn"}).then((user) => {
            expect(user).to.be.null;
        });
    });
});

describe("Database User Insertion", function() {
    this.timeout(5000);
    it("Can insert user with pre-generated token and admin position", function() {
        return db.insertUser("testUser2", "testuser", true, true).then(() => {
            return db.findUser({name: "testUser2"});
        }).then((user) => {
            expect(user).to.be.instanceOf(Object).with.property("name", "testUser2");
            expect(user).to.have.property("token").not.equal("");
            expect(user).to.have.property("secret").not.equal("");
            expect(user).to.have.property("permission").equal(2);
        });
    });
    it("Cannot insert duplicate data", function() {
        db.insertUser("testUser2", "testuser", true, true).should.be.rejected;
    });
});

describe("Database User Edit", function() {
    this.timeout(5000);
    it("Can edit data in database", function() {
        return db.updateUser("testUser2", {permission: 1}).then(() => {
            return db.findUser({name: "testUser2"});
        }).then((user) => {
            expect(user).to.be.instanceOf(Object).with.property("name", "testUser2");
            expect(user).to.have.property("permission").equal(1);
        });
    });
});

describe("Database User Deletion", function() {
    this.timeout(5000);
    it("Can delete user", function() {
        return db.deleteUser("testUser2").then(() => {
            return db.getUserCount();
        }).then((amt) => {
            expect(amt).eq(1);
        });
        
    });
});
let resId;
describe("Database Research Insertion", function() {
    this.timeout(5000);
    it("Can insert new research with researcher", function() {
        return db.insertResearch("research1", "admin").then(() => {
            return db.findResearchByName("research1");
        }).then(res=> {
            resId = res.researchId;
            expect(res).to.be.instanceOf(Object).with.property("name", "research1");
            expect(res).to.have.property("researcher").with.lengthOf(1);
        });
    });
    it("Cannot insert duplicate data", function() {
        db.insertResearch("research1", "admin").should.be.rejected;
    });
});

describe("Database Research Finder", function() {
    this.timeout(5000);
    it("Can find all researches", function() {
        return db.getResearches().then((res) => {
            res.should.be.an.instanceOf(Array).with.lengthOf(1);
        });
    });
    it("Can find specific research by name", function() {
        return db.findResearchByName("research1").then((res) => {
            res.should.be.an.instanceOf(Object).with.a.property("name", "research1");
        });
    });
    it("Can find specific research by ID", function() {
        return db.findResearchById(resId).then((res) => {
            res.should.be.an.instanceOf(Object).with.a.property("name", "research1");
        });
    });
});

describe("Database Research Edit", function() {
    this.timeout(5000);
    it("Can rename research", function() {
        return db.renameResearch("research1", "research2").then(() => {
            return db.findResearchByName("research2");
        }).then((res) => {
            expect(res).to.be.instanceOf(Object).with.property("name", "research2");
        });
    });
});

describe("Database Research Deletion", function() {
    this.timeout(5000);
    it("Can delete research", function() {
        return db.deleteResearch("research2").then(() => {
            return db.findResearchByName("research2");
        }).then((res) => {
            expect(res).to.be.null;
        });
        
    });
});