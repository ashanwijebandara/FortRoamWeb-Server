const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const path = require("path");

const app = express();


const userController = require('./src/controllers/userController');
const placeController = require('./src/controllers/placeController');
const blogController = require('./src/controllers/blogController'); 

app.use(express.json()); 
app.use("/src/images", express.static(path.join(__dirname, "/src/images")));
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

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, "src/images");
    },
    filename: (req, file, cb) => {
      cb(null, req.body.name);
    },
  });

const upload = multer({storage:storage});
app.post('/upload', upload.single('file'), (req, res) => { 
    console.log(req.file); 
    res.status(200).json('File has been uploaded');  
});

 

app.use("/user", userController);
app.use("/place", placeController); 
app.use("/blog", blogController);


app.listen(3010, () => {
    console.log('Server is running on port 3010');  
});
   