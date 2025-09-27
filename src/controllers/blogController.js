const express = require('express');
const BlogModel = require('../models/blogs');
const crypto = require('crypto');
const multer = require('multer');
const { v4: uuidv4 } = require("uuid");
const FormData = require("form-data");
const axios = require("axios");

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const imageName = (bytes = 32) => crypto.randomBytes(bytes).toString('hex');

async function uploadToCloudinary(fileBuffer, mimetype) {
  console.log("uploadToCloudinary called");

  const formData = new FormData();
  formData.append("file", fileBuffer, {
    filename: uuidv4(),
    contentType: mimetype,
  });
  formData.append("upload_preset", "Fortroam"); 

  console.log("Uploading to Cloudinary...");

  const res = await axios.post(
    "https://api.cloudinary.com/v1_1/da7ajltkm/image/upload",
    formData,
    { headers: formData.getHeaders() }
  );

  return res.data.secure_url;
}

// create a new blog
router.post('/', upload.single('file'), async (req, res, next) => {
    try {
        const { title, description, username } = req.body;

        if (!title || !description || !username) {
            return res.status(400).json({ message: 'Title, description, and username are required' });
        }

        let imageUrl = "";

        if (req.file) {
            imageUrl = await uploadToCloudinary(req.file.buffer, req.file.mimetype);
        }

        const blog = new BlogModel({
            title,
            description,
            username,
            image: imageUrl
        });

        const createdBlog = await blog.save();
        res.status(201).json(createdBlog);
    } catch (err) {
        next(err);
    }
});

// get all blogs
router.get('/', async (req, res, next) => {
    try {
        const blogs = await BlogModel.find();
        const allBlogs = blogs.map(blog => {
            return {
                _id: blog._id,
                title: blog.title,
                description: blog.description,
                username: blog.username,
                image: blog.image, // Already Cloudinary URL
                createdAt: blog.createdAt,
            };
        });

        res.status(200).json(allBlogs);
    } catch (err) {
        next(err);
    }
});

// get a blog by id
router.get('/:blogId', async (req, res, next) => {
    try {
        const blog = await BlogModel.findById(req.params.blogId);
        if (!blog) {
            return res.status(404).json({ message: 'Blog not found' });
        }

        // blog.image already contains Cloudinary URL, no need to generate signed URL

        res.status(200).json(blog);
    } catch (err) {
        next(err);
    }
});

// update a blog
router.put('/update/:blogId', upload.single('file'), async (req, res, next) => {
    try {
        const { blogId } = req.params;
        const { title, description, username } = req.body;
        const blog = await BlogModel.findById(blogId);

        if (!blog) {
            return res.status(404).json({ message: 'Blog not found' });
        }

        if (req.file) {
            const imageUrl = await uploadToCloudinary(req.file.buffer, req.file.mimetype);
            blog.image = imageUrl;
        }

        blog.title = title;
        blog.description = description;

        const updatedBlog = await blog.save();
        res.status(200).json(updatedBlog);
    } catch (err) {
        next(err);
    }
});


// delete a blog
router.delete('/delete/:blogId', async (req, res, next) => {
    try {
        const blog = await BlogModel.findById(req.params.blogId);
        if (!blog) {
            return res.status(404).json({ message: 'Blog not found' });
        }

        // No need to delete from Cloudinary, images are managed externally

        await BlogModel.deleteOne({ _id: req.params.blogId });
        res.status(200).json({ message: "Blog has been deleted" });
    } catch (err) {
        next(err);
    }
});

// get all blogs by username
router.get('/user/:username', async (req, res, next) => {
    try {
        const username = req.params.username;
        const blogs = await BlogModel.find({ username });

        if (!blogs || blogs.length === 0) {
            return res.status(404).json({ message: 'No blogs found' });
        }

        const userBlogs = blogs.map(blog => {
            return {
                _id: blog._id,
                title: blog.title,
                description: blog.description,
                username: blog.username,
                image: blog.image, // Already Cloudinary URL
                createdAt: blog.createdAt
            };
        });

        res.status(200).json(userBlogs);
    } catch (err) {
        next(err);
    }
}); 

module.exports = router;


