const express = require('express');
const BlogModel = require('../models/blogs');

const router = express.Router();

// create a new blog
router.post('/', async (req, res, next) => {
    try {
        const blog = new BlogModel(req.body);
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
        res.status(200).json(blogs);
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

        res.status(200).json(blog);
    } catch (err) {
        next(err);
    }
});

// update a blog
router.put('/update/:blogId', async (req, res, next) => {
    try {

        const blog = await BlogModel.findById(req.params.blogId);

        if (blog.username == req.body.username) {
            try {
                const updatedBlog = await BlogModel.findByIdAndUpdate(
                    req.params.blogId,
                    {
                        $set: req.body,
                    },
                    {
                        new: true
                    }
                );
                res.status(200).json(updatedBlog);
            }
            catch (err) {
                next(err);
            }

        } else {
            res.status(401).json("You are not authorized to update this blog");
        }
    } catch (err) {
        next(err);
    }
});

// delete a blog
router.delete('/delete/:blogId', async (req, res, next) => {
    try {
        const blog = await BlogModel.findById(req.params.blogId);

        if (blog.username == req.body.username) {
            try {
                await blog.delete();
                res.status(200).json({ message: "Blog has been deleted" });
            } catch (err) {
                next(err);
            }
        } else {
            res.status(401).json("You are not authorized to delete this blog");
        }
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

        res.status(200).json(blogs);
    } catch (err) {
        next(err);
    }
});

module.exports = router; 

