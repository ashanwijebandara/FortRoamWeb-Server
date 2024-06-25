const express = require('express');
const BlogModel = require('../models/blogs');
const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const crypto = require('crypto');
const multer = require('multer');

const router = express.Router();

const bucketName = process.env.BUCKET_NAME;
const bucketRegion = process.env.BUCKET_REGION;
const bucketAccessKey = process.env.BUCKET_ACCESS_KEY;
const bucketSecretAccessKey = process.env.BUCKET_SECRET_ACCESS_KEY;

const s3Client = new S3Client({
    region: bucketRegion,
    credentials: {
        accessKeyId: bucketAccessKey,
        secretAccessKey: bucketSecretAccessKey
    }
});

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const imageName = (bytes = 32) => crypto.randomBytes(bytes).toString('hex');

// create a new blog
router.post('/', upload.single('file'), async (req, res, next) => {
    try {
        const { title, description, username } = req.body;

        if (!title || !description || !username) {
            return res.status(400).json({ message: 'Title, description, and username are required' });
        }

        const image = imageName();
        const params = {
            Bucket: bucketName,
            Key: image,
            Body: req.file.buffer,
            ContentType: req.file.mimetype
        };
        const command = new PutObjectCommand(params);
        await s3Client.send(command);

        const blog = new BlogModel({
            title,
            description,
            username,
            image
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
        const allBlogs = await Promise.all(blogs.map(async blog => {
            var url;

            if (blog.image) {
                const getObjectParams = {
                    Bucket: bucketName,
                    Key: blog.image
                };
                const command = new GetObjectCommand(getObjectParams);
                const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
                blog.imageURL = url;
            }
            // return {
            //     _id: blog._id,
            //     title: blog.title,
            //     description: blog.description,
            //     username: blog.username,
            //     image: blog.image,
            //     createdAt: blog.createdAt,
            //     imageURL: url
            // };
            return blog;
        }));


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

        if (blog.image) {
            const getObjectParams = {
                Bucket: bucketName,
                Key: blog.image
            };
            const command = new GetObjectCommand(getObjectParams);
            const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
            blog.image = url;
        }

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

        if (blog.username !== username) {
            return res.status(401).json("You are not authorized to update this blog");
        }

        if (req.file) {
            if (blog.image) {
                const deleteParams = {
                    Bucket: bucketName,
                    Key: blog.image
                };
                const deleteCommand = new DeleteObjectCommand(deleteParams);
                await s3Client.send(deleteCommand);
            }

            const newImageName = imageName();
            const uploadParams = {
                Bucket: bucketName,
                Key: newImageName,
                Body: req.file.buffer,
                ContentType: req.file.mimetype
            };
            const uploadCommand = new PutObjectCommand(uploadParams);
            await s3Client.send(uploadCommand);
            blog.image = newImageName;
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

        if (blog.image) {
            const params = {
                Bucket: bucketName,
                Key: blog.image
            };
            const command = new DeleteObjectCommand(params);
            await s3Client.send(command);
        }

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

        const userBlogs = await Promise.all(blogs.map(async blog => {
            var url;

            if (blog.image) {
                const getObjectParams = {
                    Bucket: bucketName,
                    Key: blog.image
                };
                const command = new GetObjectCommand(getObjectParams);
                const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
                blog.imageURL = url;
            }
            return {
                _id: blog._id,
                title: blog.title,
                description: blog.description,
                username: blog.username,
                image: blog.image,
                imageURL: url
            };
        }));

        res.status(200).json(userBlogs);
    } catch (err) {
        next(err);
    }
}); 

module.exports = router;


