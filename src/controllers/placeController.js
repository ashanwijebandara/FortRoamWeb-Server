const {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const crypto = require("crypto");
const express = require("express");
const PlaceModel = require("../models/places");
const { v4: uuidv4 } = require("uuid");
const FormData = require("form-data");
const axios = require("axios");

const router = express.Router();

const multer = require("multer");
const imageName = (bytes = 32) => crypto.randomBytes(bytes).toString("hex");

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
const upload = multer({ storage: storage });

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

router.get("/", async (req, res, next) => {
  try {
    const places = await PlaceModel.find();

    const allPlaces = await Promise.all(
      places.map(async (place) => {
        var url;
        if (place.image) {
          const getObjectParams = {
            Bucket: bucketName,
            Key: place.image,
          };
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
          image: place.image,
          imageURL: url,
          latitude: place.latitude,
          longitude: place.longitude,
          reviews: place.reviews,
          type: place.type,
          subtype: place.subtype,
        };
      })
    );

    res.status(200).json(allPlaces);
  } catch (err) {
    next(err);
  }
});

router.get("/subtype/:subtype", async (req, res, next) => {
  try {
    const subtype = req.params.subtype;
    const subTypes = await PlaceModel.find({ subtype });

    if (!subTypes || subTypes.length === 0) {
      return res.status(404).json({ message: "No subTypes found" });
    }

    const subtypeplaces = await Promise.all(
      subTypes.map(async (place) => {
        var url;
        if (place.image) {
          const getObjectParams = {
            Bucket: bucketName,
            Key: place.image,
          };
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
          image: place.image,
          imageURL: url,
          latitude: place.latitude,
          longitude: place.longitude,
          reviews: place.reviews,
          type: place.type,
          subtype: place.subtype,
        };
      })
    );

    res.status(200).json(subtypeplaces);
  } catch (err) {
    next(err);
  }
});

router.get("/type/:type", async (req, res, next) => {
  try {
    const type = req.params.type;
    const types = await PlaceModel.find({ type });

    if (!types || types.length === 0) {
      return res.status(404).json({ message: "No Types found" });
    }

    // Calculate average rating for each place
    const typesWithAverageRating = await Promise.all(
      types.map(async (place) => {
        let totalRating = 0;
        var url;
        if (place.reviews.length > 0) {
          totalRating = place.reviews.reduce(
            (acc, review) => acc + review.rating,
            0
          );
          totalRating /= place.reviews.length;
        }
        if (place.image) {
          const getObjectParams = {
            Bucket: bucketName,
            Key: place.image,
          };
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
          image: place.image,
          imageURL: url,
          reviews: place.reviews,
          type: place.type,
          subtype: place.subtype,
        };
      })
    );

    res.status(200).json(typesWithAverageRating);
  } catch (err) {
    next(err);
  }
});

router.get("/:placeId", async (req, res, next) => {
  try {
    const place = await PlaceModel.findById(req.params.placeId);

    if (!place) {
      return res.status(404).json({ message: "Place not found" });
    }
    const getObjectParams = {
      Bucket: bucketName,
      Key: place.image,
    };
    const command = new GetObjectCommand(getObjectParams);
    const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
    place.image = url;

    res.status(200).json(place);
  } catch (err) {
    next(err);
  }
});

router.get("/review/top", async (req, res, next) => {
  try {
    const places = await PlaceModel.find();

    // Calculate average rating for each place
    const placesWithAverageRating = places.map((place) => {
      let totalRating = 0;
      if (place.reviews.length > 0) {
        totalRating = place.reviews.reduce(
          (acc, review) => acc + review.rating,
          0
        );
        totalRating /= place.reviews.length;
      }
      return {
        placeId: place._id,
        averageRating: totalRating,
        totalReviews: place.reviews.length,
      };
    });

    placesWithAverageRating.sort((a, b) => b.averageRating - a.averageRating);

    const top5Places = placesWithAverageRating.slice(0, 5);

    const topPlacesDetails = await Promise.all(
      top5Places.map(async (place) => {
        const detailedPlace = await PlaceModel.findById(place.placeId);

        const getObjectParams = {
          Bucket: bucketName,
          Key: detailedPlace.image,
        };
        const command = new GetObjectCommand(getObjectParams);
        const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
        detailedPlace.image = url;

        return {
          _id: detailedPlace._id,
          title: detailedPlace.title,
          street: detailedPlace.street,
          description: detailedPlace.description,
          averageRating: place.averageRating,
          totalReviews: place.totalReviews,
          image: detailedPlace.image,
        };
      })
    );

    return res.status(200).json(topPlacesDetails);
  } catch (err) {
    next(err);
  }
});

// calculate avarage rating of the places
router.get("/review/:placeId", async (req, res, next) => {
  try {
    const place = await PlaceModel.findById(req.params.placeId);

    if (!place) {
      return res.status(404).json({ message: "Place not found" });
    }

    let totalRating = 0;
    if (place.reviews.length > 0) {
      totalRating = place.reviews.reduce(
        (acc, review) => acc + review.rating,
        0
      );
      totalRating /= place.reviews.length;
    }

    const totalReviews = place.reviews.length;

    return res.status(200).json({ averageRating: totalRating, totalReviews });
  } catch (err) {
    next(err);
  }
});

// add a review for a place
router.post("/review/:id", async (req, res, next) => {
  try {
    const placeId = req.params.id;
    const { name, rating, content } = req.body;

    if (!name || !rating || !content) {
      return res.status(400).json({
        message: "Name, rating, and text are required fields for a review",
      });
    }

    const place = await PlaceModel.findById(placeId);

    if (place) {
      const newReview = {
        name: name,
        rating: rating,
        content: content,
      };
      place.reviews.push(newReview);

      const updatedPlace = await place.save();

      res.status(200).json(updatedPlace);
    } else {
      res.status(404).json({ message: "Place not found" });
    }
  } catch (err) {
    next(err);
  }
});

// for admin //

// GET places by type
router.get("/types/:type", async (req, res, next) => {
  try {
    const type = req.params.type;
    const places = await PlaceModel.find({ type });

    if (!places || places.length === 0) {
      return res.status(404).json({ message: "No Types found" });
    }

    const typesPlaces = places.map((place) => ({
      _id: place._id,
      title: place.title,
      description: place.description,
      street: place.street,
      image: place.image, // Already Cloudinary URL
      latitude: place.latitude,
      longitude: place.longitude,
      reviews: place.reviews,
      type: place.type,
      subtype: place.subtype,
    }));

    res.status(200).json(typesPlaces);
  } catch (err) {
    next(err);
  }
});

// POST create a new place
router.post("/", upload.single("file"), async (req, res, next) => {
  try {
    const { type, subtype, title, description, street, latitude, longitude } =
      req.body;
    let imageUrl = "";

    if (req.file) {
      imageUrl = await uploadToCloudinary(req.file.buffer, req.file.mimetype);
    }

    const newPlace = new PlaceModel({
      type,
      subtype,
      title,
      description,
      street,
      image: imageUrl,
      latitude,
      longitude,
      reviews: [],
    });

    const createdPlace = await newPlace.save();
    res.status(201).json(createdPlace);
  } catch (err) {
    next(err);
  }
});

// DELETE a place
router.delete("/:placeId", async (req, res, next) => {
  try {
    const place = await PlaceModel.findById(req.params.placeId);
    if (!place) {
      return res.status(404).json({ message: "Place not found" });
    }

    await PlaceModel.deleteOne({ _id: req.params.placeId });

    res.status(200).json({ message: "Place has been deleted" });
  } catch (err) {
    next(err);
  }
});

// PUT update a place
router.put("/:placeId", upload.single("file"), async (req, res, next) => {
  try {
    const { placeId } = req.params;
    const { type, subtype, title, description, street, latitude, longitude } =
      req.body;
    const place = await PlaceModel.findById(placeId);
    console.log("Place found:", place);

    if (!place) {
      return res.status(404).json({ message: "Place not found" });
    }

    if (req.file) {
      const imageUrl = await uploadToCloudinary(
        req.file.buffer,
        req.file.mimetype
      );
      console.log("Uploaded image URL:", imageUrl);
      place.image = imageUrl;
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
