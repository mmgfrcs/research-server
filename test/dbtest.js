process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = process.env.MONGODB_URI_TEST;
let chai = require("chai");
let chaiHttp = require('chai-http');
let chaiPromise = require('chai-as-promised');
let expect = chai.expect;
// eslint-disable-next-line no-unused-vars
let should = chai.should();

let db = require("../src/db");

chai.use(chaiHttp);
chai.use(chaiPromise);

describe("Database User Finder", function() {
    
    it("Can find all users", function() {
        return db.getUsers().then((user) => {
            user.should.be.an.instanceOf(Array);
            user.should.have.length.above(0);
            expect(user[0].name).to.not.be.undefined;
        });
    });
    it("Can find user given correct name", function() {
        return db.findUser({name: "admin"}).then((user) => {
            
            user.should.be.an.instanceOf(Object).with.a.property("name", "admin");
        });
    });
    it("Cannot find user given wrong name", function() {
        db.findUser({name: "admn"}).should.be.rejected;
    });
});

describe("Database User Insertion", function() {
    
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
    
    it("Can delete user", function() {
        return db.deleteUser("testUser2").then(() => {
            expect(db.findUser("testUser2")).to.be.rejected;
        });
        
    });
});
let resId;
describe("Database Research Insertion", function() {
    
    it("Can insert new research with researcher", function() {
        return db.insertResearch("research1", "admin").then(() => {
            return db.findResearchByName("research1");
        }).then(res=> {
            resId = res.researchId;
            expect(res).to.be.instanceOf(Object).with.property("name", "research1");
            expect(res).to.have.property("researchers").with.lengthOf(1);
        });
    });
    it("Cannot insert duplicate data", function() {
        db.insertResearch("research1", "admin").should.be.rejected;
    });
});

describe("Database Research Finder", function() {
    
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
    
    it("Can rename research", function() {
        return db.renameResearch(resId, "research2").then(() => {
            return db.findResearchByName("research2");
        }).then((res) => {
            resId = res.researchId;
            expect(res).to.be.instanceOf(Object).with.property("name", "research2");
        });
    });
});

describe("Database Research Deletion", function() {
    
    it("Can delete research", function() {
        return db.deleteResearch(resId).then(() => {
            db.findResearchByName("research2").should.be.rejected;
        });
    });
});

after(function() {
    return db.userExists("testUser2").then(exist=> {
        if(exist) return db.deleteUser("testUser2");
        else return Promise.resolve();
    });
});