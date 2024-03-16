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

router.post("/login", async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await UserModel.findOne({ email });

        if (user) {
            
           // const isPasswordValid = await bcrypt.compare(password, user.password);

            // if (isPasswordValid) {
            //     res.json({ message: "Success" ,data: user });
            // } else {
            //     console.log("Password comparison failed.");
            //     res.json({ message: "The password is incorrect" });
            // }

            if(password === user.password){
                res.json({ message: "Success" ,data: user });
            }else{
                res.json({ message: "The password is incorrect" });
            }
           
        } else {
            res.json({ message: "No record exists for this email" });
        }
    } catch (error) {
        console.error("Error during login:", error);
        res.status(500).json({ message: "An error occurred during login" });
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
