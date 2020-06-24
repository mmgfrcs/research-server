const db = require("../src/db");
const jwt = require("jsonwebtoken");
const passport = require("passport");
const logger = require("../src/logger");
const bearerAuth = require("../src/bearerAuth");
const { check, validationResult } = require('express-validator');

let router = bearerAuth();

router.use(passport.authenticate('bearer', {session: false, failWithError: true}), (req, res, next) => {
    if(!req.body.token) return res.status(400).send({"error": "Token is required."});
    else {
        db.findUser({token: req.body.token}).then(user=> {
            if(user !== null && jwt.verify(req.body.token, user.secret) == user.name) next();
            else return res.status(400).send({"error": "Invalid token."});
        }).catch(()=> next(new Error("Invalid token.")));
    }
});

function checkPermLevel(permLvl) {
    return function(req, res, next) {
        if(req.user.permission < permLvl) res.status(403).send({"error": "You don't have enough permission to do that"});
        else next();
    };
}

//GET all research
router.get("/", (req, res, next) => {
    db.getResearches().then(result=> {
        if(req.user.permission > 0) res.send(result); //Perm 1 or 2: All researches
        else res.send(result.filter(val => val.researchers.includes(req.user.name))); //Perm 0: All researches user is a part of
    }).catch(next);
});

//POST new research
router.post("/", checkPermLevel(1), 
    check("name", "Name is empty").exists().escape(),
    check("researchers", "Researchers must be an array").optional().isArray(),
    (req, res, next) => {
        const errors = validationResult(req);
        if(!errors.isEmpty()) return res.status(400).send({error: errors.array()});
        let researcherList = req.body.researchers || [];
        researcherList.push(req.user.name); //Push yourself to the list of researchers
        db.insertResearch(req.body.name, ...researcherList).then(result=> {
            res.header("Location", result.researchId).sendStatus(201);
        }).catch(next);
    }
);

//DELETE all researches!
router.delete("/", checkPermLevel(1), (req, res, next) => {
    db.deleteAllResearches().then(doc=> {
        if(doc.ok == 1) res.sendStatus(200);
        else res.sendStatus(404);
    }).catch(next);
});

//GET specific research
router.get("/:researchId", (req, res, next) => {
    db.findResearchById(req.params.researchId).then(result=> {
        if(req.user.permission > 0 || result.researchers.includes(req.user.name)) 
            res.send(result); //Allow if user is part of research or has Permission 1 or 2
        else { //Construct an error object and throw it to be handled by the error handler below
            let err = new Error("You don't have enough permission to access this resource");
            err.status = 403;
            throw err;
        } 
    }).catch(next);
});

//PUT specific research name. NOTE THAT THIS CHANGES THE RESEARCH ID
router.put("/:researchId", checkPermLevel(1), check("name").exists().escape(), (req, res, next) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()) return res.status(400).send({error: errors.array()});
    db.renameResearch(req.params.researchId, req.body.name).then(doc=> {
        res.status(200).send({"researchId": doc.researchId}); //Allow if user is part of research or has Permission 1 or 2
    }).catch(next);
});

//DELETE specific research
router.delete("/:researchId", checkPermLevel(1), (req, res, next) => {
    db.deleteResearch(req.params.researchId).then(doc=> {
        if(doc == null) res.sendStatus(200);
        else res.sendStatus(404);
    }).catch(next);
});

//GET data for specific research
router.get("/:researchId/data", (req, res, next) => {
    db.findResearchById(req.params.researchId).then(result=> {
        if(req.user.permission > 0 || result.researchers.includes(req.user.name)) 
            res.send(result.data); //Allow if user is part of research or has Permission 1 or 2
        else { //Construct an error object and throw it to be handled by the error handler below
            let err = new Error("You don't have enough permission to access this resource");
            err.status = 403;
            throw err;
        } 
    }).catch(next);
});

//POST new research data
router.post("/:researchId/data",
    check("data", "Data cannot be empty").exists(),
    (req, res, next) => {
        const errors = validationResult(req);
        if(!errors.isEmpty()) return res.status(400).send({error: errors.array()});
        db.findResearchById(req.params.researchId).then(result=> {
            if(req.user.permission > 0 || result.researchers.includes(req.user.name)) 
                return db.insertResearchData(req.params.researchId, req.body.data); //Allow if user is part of research or has Permission 1 or 2
            else { //Construct an error object and throw it to be handled by the error handler below
                let err = new Error("You don't have enough permission to create this resource");
                err.status = 403;
                throw err;
            } 
        }).then(()=> {
            res.sendStatus(201);
        }).catch(next);
    }
);

//DELETE all research data
router.delete("/:researchId/data",
    (req, res, next) => {
        db.findResearchById(req.params.researchId).then(result=> {
            if(req.user.permission > 0 || result.researchers.includes(req.user.name)) 
                return db.deleteAllResearchData(req.params.researchId); //Allow if user is part of research or has Permission 1 or 2
            else { //Construct an error object and throw it to be handled by the error handler below
                let err = new Error("You don't have enough permission to create this resource");
                err.status = 403;
                throw err;
            } 
        }).then(()=> {
            res.sendStatus(200);
        }).catch(next);
    }
);

//GET list of specific research's researcher list
router.get("/:researchId/researcher", (req, res, next) => {
    db.findResearchById(req.params.researchId).then(result=> {
        if(req.user.permission > 0 || result.researchers.includes(req.user.name)) 
            res.send(result.researchers); //Allow if user is part of research or has Permission 1 or 2
        else { //Construct an error object and throw it to be handled by the error handler below
            let err = new Error("You don't have enough permission to access this resource");
            err.status = 403;
            throw err;
        } 
    }).catch(next);
});

//POST new researchers to the research
router.post("/:researchId/researcher",
    check("researchers", "Researcher list must be in array").isArray(),
    (req, res, next) => {
        const errors = validationResult(req);
        if(!errors.isEmpty()) return res.status(400).send({error: errors.array()});
        db.findResearchById(req.params.researchId).then(result=> {
            if(req.user.permission > 0 || result.researchers.includes(req.user.name)) 
                return db.insertResearchers(req.params.researchId, req.body.researchers); //Allow if user is part of research or has Permission 1 or 2
            else { //Construct an error object and throw it to be handled by the error handler below
                let err = new Error("You don't have enough permission to create this resource");
                err.status = 403;
                throw err;
            } 
        }).then(()=> {
            res.sendStatus(201);
        }).catch(next);
    }
);

//DELETE a researcher
router.delete("/:researchId/researcher/:name",
    checkPermLevel(1),
    (req, res, next) => {
        db.deleteResearcher(req.params.researchId, req.params.name).then(()=> {
            res.sendStatus(200);
        }).catch(next);
    }
);

// eslint-disable-next-line no-unused-vars
router.use(function (err,_req,res,next) {
    if(err.status !== undefined) return next(err);

    let output = {error: err.message};
    logger.error(err);
    res.status(400).send(output);
});

// eslint-disable-next-line no-unused-vars
router.use(function (err,req,res,_next) {
    let output = {error: err.message};
    if(err.status == 401) {
        logger.error("Failed API login attempt from " + req.ip);
        output.error+= ": Invalid Bearer token";
    }
    else logger.error(err);

    if(err.status >= 500) output.error = "Server Error"; 

    var statusCode = err.status || 500;
    res.status(statusCode).send(output);
});

module.exports = router;