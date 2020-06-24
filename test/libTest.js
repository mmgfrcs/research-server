let chai = require("chai");
let expect = chai.expect;
let lib = require("../lib/mainLib");

let flatData = [{"name": "V", "val": "X"}, {"name": "V", "y": "Z"}];
let nestedData = [{"name": "V", "val": {"key":"name", "value": "X"}}, {"name": "V", "y": "Z"}];

describe("Utility Functions", function() {
    it("checkKeys Flat", function() {
        expect(lib.checkKeys(flatData)).to.be.an.instanceOf(Array).with.lengthOf(3);
        expect(lib.checkKeys(flatData)[2]).to.be.equal("y");
    });
    it("checkKeys Nested", function() {
        expect(lib.checkKeys(nestedData)).to.be.an.instanceOf(Array).with.lengthOf(4);
        expect(lib.checkKeys(nestedData)[2]).to.be.equal("val.value");
    });
    it("byString", function() {
        expect(lib.byString(flatData[0], "val")).to.be.equal("X");
        expect(lib.byString(nestedData[0], "val.key")).to.be.equal("name");
        expect(lib.byString(nestedData[0], "val.value")).to.be.equal("X");
    });
    it("camelCase to Title Case", function() {
        expect(lib.camelCaseToTitleCase("thePhantomBullet")).to.be.equal("The Phantom Bullet");
        expect(lib.camelCaseToTitleCase("aaxMMgfrcs")).to.be.equal("Aax M Mgfrcs");
    });
});