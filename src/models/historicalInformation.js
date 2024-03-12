const mongoose = require('mongoose');

const HistoricalInformationSchema = new mongoose.Schema({
    place:{
        type: String,
        required: true
    },
    details:{
        type: String,
        required: true
    },
    });

    const HistoricalInformationModel = mongoose.model("historicalInformation", HistoricalInformationSchema);

    module.exports = HistoricalInformationModel;