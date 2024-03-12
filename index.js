const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();


const userController = require('./src/controllers/userController');
const historicalInformationController = require('./src/controllers/historyController');

app.use(express.json());
app.use(cors());

const dbUrl = "mongodb+srv://test_user:D803jMp9AalcQyxE@cluster0.szxkpy2.mongodb.net/FortRoam?retryWrites=true&w=majority";

mongoose.connect(dbUrl)
    .then(() => { 
        console.log('Connected to MongoDB');
    })
    .catch((err) => {
        console.log('Connection to MongoDB failed');
        console.log(err);
    } 
);

app.use("/user", userController);
app.use("/historicalInformation",historicalInformationController);


app.listen(3000, () => {
    console.log('Server is running on port 3000');
});
   