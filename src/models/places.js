const mongoose = require('mongoose');


const PlaceSchema = new mongoose.Schema({
    type: {
        type: String
    },
    subtype: {
        type: String
    },
    title: {
        type: String
    },
    description: {
        type: String
    },
    street: {
        type: String
    },
    image: {
        type: String
    },
    latitude: {
        type: String
    },
    longitude: {
        type: String
    },
    reviews: [
        {
            rating: Number,
            content: String,
            name: String
        }
    ]

});

const PlaceModel = mongoose.model("places", PlaceSchema);

module.exports = PlaceModel;