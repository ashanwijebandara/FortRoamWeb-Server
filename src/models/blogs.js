const mongoose = require('mongoose');

const BlogSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true
        },
        description: {
            type: String,
            required: true 
        },
        username: {
            type: String,
            required: true
        },
        image: {
            type: String,
           // required: true
        }
    },
    {
        timestamps: true
    }
);

const BlogModel = mongoose.model('blog', BlogSchema);

module.exports = BlogModel;