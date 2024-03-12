const express = require('express');
const HistoricalInformationModel = require('../models/historicalInformation');

const router = express.Router();

router.get('/', async (req, res, next) => {
    try {
        const historicalInformation = await HistoricalInformationModel.find();
        res.status(200).json(historicalInformation);
       // console.log(historicalInformation);
    } catch (err) {
        next(err);
    }
});



module.exports = router;