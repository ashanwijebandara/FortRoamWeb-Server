const express = require('express');
const PlaceModel = require('../models/places');

const router = express.Router();

router.get('/', async (req, res, next) => {
    try {
        const places = await PlaceModel.find();
        res.status(200).json(places);
    } catch (err) {
        next(err);
    }
});

router.post('/', async (req, res, next) => {
    try {
        const place = new PlaceModel(req.body);
        const createdPlace = await place.save();
        res.status(201).json(createdPlace);
    } catch (err) {
        next(err);
    }
});

module.exports = router;