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

        // Calculate average rating for each place
        const typesWithAverageRating = await Promise.all(types.map(async place => {
            let totalRating = 0;
            if (place.reviews.length > 0) {
                totalRating = place.reviews.reduce((acc, review) => acc + review.rating, 0);
                totalRating /= place.reviews.length;
            }
            return {
                _id: place._id,
                title: place.title,
                street: place.street,
                description: place.description,
                averageRating: totalRating,
                totalReviews: place.reviews.length
            };
        }));

        res.status(200).json(typesWithAverageRating);
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

router.get('/review/top', async (req, res, next) => {
    try {
        const places = await PlaceModel.find();

        // Calculate average rating for each place
        const placesWithAverageRating = places.map(place => {
            let totalRating = 0;
            if (place.reviews.length > 0) {
                totalRating = place.reviews.reduce((acc, review) => acc + review.rating, 0);
                totalRating /= place.reviews.length;
            }
            return {
                placeId: place._id,
                averageRating: totalRating,
                totalReviews: place.reviews.length
            };
        });

        
        placesWithAverageRating.sort((a, b) => b.averageRating - a.averageRating);

       
        const top5Places = placesWithAverageRating.slice(0, 5);

        
        const topPlacesDetails = await Promise.all(top5Places.map(async place => {
            const detailedPlace = await PlaceModel.findById(place.placeId);
            return {
                _id: detailedPlace._id,
                title: detailedPlace.title,
                street: detailedPlace.street,
                description: detailedPlace.description,
                averageRating: place.averageRating, 
                totalReviews: place.totalReviews,
                image:detailedPlace.image
            };
        }));

        return res.status(200).json(topPlacesDetails);
    } catch (err) {
        next(err);
    }
});




// calculate avarage rating of the places
router.get('/review/:placeId', async (req , res , next)=> {
    try {
        const place = await PlaceModel.findById(req.params.placeId);

        if(!place){
            return res.status(404).json({ message: 'Place not found' });
        }
        
         
         let totalRating = 0;
         if (place.reviews.length > 0) {
             totalRating = place.reviews.reduce((acc, review) => acc + review.rating, 0);
             totalRating /= place.reviews.length;
         }

         const totalReviews = place.reviews.length;
 
         return res.status(200).json({ averageRating: totalRating ,totalReviews}); 
     } catch (err) {
        next(err);
    }
 });


// add a review for a place
router.post('/review/:id', async (req, res, next) => {
    try {
        const placeId = req.params.id;
        const { name, rating, content } = req.body;

       
        if (!name || !rating || !content) {
            return res.status(400).json({ message: "Name, rating, and text are required fields for a review" });
        }

        
        const place = await PlaceModel.findById(placeId);

       
        if (place) {
            
            const newReview = {
                name: name,
                rating: rating,
                content: content
            };

           
            place.reviews.push(newReview);

            
            const updatedPlace = await place.save();

            
            res.status(200).json(updatedPlace);
        } else {
            
            res.status(404).json({ message: 'Place not found' });
        }
    } catch (err) {
        
        next(err);
    }
});


module.exports = router;