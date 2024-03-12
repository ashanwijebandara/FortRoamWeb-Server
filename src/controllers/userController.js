const express = require("express");
const UserModel = require("../models/users");

const router = express.Router();

router.post('/signup', async (req, res, next) => {
    console.log(req.body);
    try {
        const query = { email: req.body.email };
        const user = await UserModel.findOne(query);
        if(user){
            return res.status(400).json({msg: "User already exists"});
        }
        const newUser = new UserModel({
            email: req.body.email,
            password: req.body.password,
            name: req.body.name
        });
        const result = await newUser.save();
        
        res.status(201).json({message: "Signed up successfully", result});
    } catch (err) {
        
        next(err); 
    }
});


router.get('/', async (req, res, next) => {
    try {
        const users = await UserModel.find();
        res.status(200).json(users);
        console.log(users);
    } catch (err) {
        next(err);
    }
});

module.exports = router;
