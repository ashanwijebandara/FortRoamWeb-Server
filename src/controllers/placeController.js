const express = require('express');
const PlaceModel = require('../models/places');

const router = express.Router();

router.get('/', async (req, res, next) => {
    try {
        const places = await PlaceModel.find();
        res.status(200).json(places);
        console.log(places);
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

router.get('/subtype/:subtype', async (req, res, next) => {
    try {
        const subtype = req.params.subtype; 
        const subTypes = await PlaceModel.find({ subtype });

        if (!subTypes || subTypes.length === 0) {
            return res.status(404).json({ message: 'No subTypes found' });
        }

        res.status(200).json(subTypes);
    } catch (err) { 
        next(err);
    }
});
router.get('/type/:type', async (req, res, next) => {
    try {
        const type = req.params.type; 
        const types = await PlaceModel.find({ type });

        if (!types || types.length === 0) {
            return res.status(404).json({ message: 'No Types found' });
        }

        res.status(200).json(types);
    } catch (err) { 
        next(err);
    }
});

router.get('/:placeId', async (req, res, next) => {
    try {
        const place = await PlaceModel.findById(req.params.placeId);
 
        if (!place) {
            return res.status(404).json({ message: 'Place not found' });
        }

        res.status(200).json(place);
    } catch (err) {
        next(err);
    }
});

module.exports = router;