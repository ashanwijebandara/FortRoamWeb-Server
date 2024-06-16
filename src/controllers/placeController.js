const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { crypto } = require("crypto")
const express = require('express');
const PlaceModel = require('../models/places');

const router = express.Router();

const multer = require('multer');
const imageName = (bytes=32) => crypto.randomBytes().toString('hex')

const bucketName = process.env.BUCKET_NAME;
const bucketReagion = process.env.BUCKET_REGION;
const bucketAccessKey = process.env.BUCKET_ACCESS_KEY;
const bucketSecretAccessKey = process.env.BUCKET_SECRET_ACCESS_KEY;

const s3Client = new S3Client({
    region: bucketReagion,
    credentials: {
        accessKeyId: bucketAccessKey,
        secretAccessKey: bucketSecretAccessKey
    }
});

const storage = multer.memoryStorage();
const upload = multer({storage: storage});

router.get('/', async (req, res, next) => {
    try {
        const places = await PlaceModel.find();

        const allPlaces = await Promise.all(places.map(async place => {
            var url;
            if (place.image) {
                const getObjectParams = {
                    Bucket: bucketName,
                    Key: place.image
                }
                const command = new GetObjectCommand(getObjectParams);
                url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
                place.imageURL = url;
            } else {
                console.error(`No image key found for place ID: ${place._id}`);
            }
            return {
                _id: place._id,
                title: place.title,
                description: place.description,
                street: place.street,
                image:place.image,
                imageURL: url,
                latitude: place.latitude,
                longitude: place.longitude,
                reviews: place.reviews,
                type: place.type,
                subtype: place.subtype
            };
        }));

        res.status(200).json(allPlaces);
      
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

        const subtypeplaces = await Promise.all(subTypes.map(async place => {
            var url;
            if (place.image) {
                const getObjectParams = {
                    Bucket: bucketName,
                    Key: place.image
                }
                const command = new GetObjectCommand(getObjectParams);
                url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
                place.imageURL = url;
            } else {
                console.error(`No image key found for place ID: ${place._id}`);
            }
            return {
                _id: place._id,
                title: place.title,
                description: place.description,
                street: place.street,
                image:place.image,
                imageURL: url,
                latitude: place.latitude,
                longitude: place.longitude,
                reviews: place.reviews,
                type: place.type,
                subtype: place.subtype
            };
        }));

        res.status(200).json(subtypeplaces);
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
            var url;
            if (place.reviews.length > 0) {
                totalRating = place.reviews.reduce((acc, review) => acc + review.rating, 0);
                totalRating /= place.reviews.length;
            }
            if (place.image) {
                const getObjectParams = {
                    Bucket: bucketName,
                    Key: place.image
                }
                const command = new GetObjectCommand(getObjectParams);
                url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
                place.imageURL = url;
            } else {
                console.error(`No image key found for place ID: ${place._id}`);
            }
            return {
                _id: place._id,
                title: place.title,
                street: place.street,
                description: place.description,
                averageRating: totalRating,
                totalReviews: place.reviews.length,
                image:place.image,
                imageURL: url,
                reviews: place.reviews,
                type: place.type,
                subtype: place.subtype
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
        const getObjectParams = {
            Bucket: bucketName,
            Key: place.image
        }
        const command = new GetObjectCommand(getObjectParams);
        const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
        place.image = url;

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




// for admin //

router.get('/types/:type', async (req, res, next) => {
    try {
        const type = req.params.type; 
        const types = await PlaceModel.find({ type });

        if (!types || types.length === 0) {
            return res.status(404).json({ message: 'No Types found' });
        }

        const typesPlaces = await Promise.all(types.map(async place => {
            var url;
            if (place.image) {
                const getObjectParams = {
                    Bucket: bucketName,
                    Key: place.image
                }
                const command = new GetObjectCommand(getObjectParams);
                url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
                place.imageURL = url;
            } else {
                console.error(`No image key found for place ID: ${place._id}`);
            }

            return {
                _id: place._id,
                title: place.title,
                description: place.description,
                street: place.street,
                image:place.image,
                imageURL: url,
                latitude: place.latitude,
                longitude: place.longitude,
                reviews: place.reviews,
                type: place.type,
                subtype: place.subtype
            };
        }));

        res.status(200).json(typesPlaces);
    } catch (err) { 
        next(err);
    }
});


router.post('/',upload.single('file'), async (req, res, next) => {
    try {
        const { type, subtype, title, description, street, latitude, longitude } = req.body;
        const image = imageName();

        const newPlace = new PlaceModel({
            type: type,
            subtype: subtype,
            title: title,
            description: description,
            street: street,
            image: image,
            latitude: latitude,
            longitude: longitude,
            reviews: [] 
        });

        const params = {
            Bucket: bucketName,
            Key: image,
            Body: req.file.buffer,
            ContentType: req.file.mimetype
        };

        const command = new PutObjectCommand(params)

        await s3Client.send(command)
        
        const createdPlace = await newPlace.save();
        res.status(201).json(createdPlace);
    } catch (err) {
        next(err);
    }
});


router.delete('/:placeId', async (req, res, next) => {
    try {
        const place = await PlaceModel.findById(req.params.placeId);
        if (!place) {
            return res.status(404).json({ message: 'Place not found' });
        }
        const params = {
            Bucket: bucketName,
            Key: place.image
        };
        const command = new DeleteObjectCommand(params)
        await s3Client.send(command)

        await PlaceModel.deleteOne({ _id: req.params.placeId });

        res.status(200).json({ message: "Place has been deleted" });
    } catch (err) {
        next(err);
    }
});


router.put('/:placeId', upload.single('file'), async (req, res, next) => {
    try {
        const { placeId } = req.params;
        const { type, subtype, title, description, street, latitude, longitude } = req.body;
        const place = await PlaceModel.findById(placeId);

        if (!place) {
            return res.status(404).json({ message: 'Place not found' });
        }

        if (req.file) {
            if (place.image) {
                const deleteParams = {
                    Bucket: bucketName,
                    Key: place.image
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
            place.image = newImageName;
        }

        place.type = type;
        place.subtype = subtype;
        place.title = title;
        place.description = description;
        place.street = street;
        place.latitude = latitude;
        place.longitude = longitude;

        const updatedPlace = await place.save();

        res.status(200).json(updatedPlace);
    } catch (err) {
        next(err);
    }
});

module.exports = router;