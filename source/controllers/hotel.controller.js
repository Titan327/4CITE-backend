const Hotel = require('../models/hotel.model');
const User = require("../models/user.model");

require('dotenv').config();

async function GetHotelByField(req, res) {
    try {
        const param = req.query;
        const keyObj = Object.keys(param)
        const searchField = ['id', 'name', 'address', 'city', 'country'];

        if (!keyObj.every((key) => searchField.includes(key))){
            return res.status(449).json({ error: "One of the fields cannot be used." });
        }

        if (keyObj.length !== 0){

            await Hotel.findAll({
                attributes: [
                    'id',
                    'name',
                    'address',
                    'city',
                    'country',
                    'description',
                    'createdAt',
                ],
                where:param
            }).then((resultat) => {

                return res.status(200).json({ success: resultat });

            }).catch((err) => {
                return res.status(500).json({ error: "An error has occurred." });
            });

        }else {
            return res.status(500).json({error: "An error has occurred."});
        }
    } catch (error) {
        return res.status(500).json({ error: 'An error has occurred.' });
    }
}



module.exports = {
    GetHotelByField,
};
