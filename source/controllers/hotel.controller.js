const Hotel = require('../models/hotel.model');
const User = require("../models/user.model");
require('dotenv').config();

async function getHotelByField(req, res) {
    try {
        const param = req.query;
        const keyObj = Object.keys(param);
        const searchField = ['id', 'name', 'address', 'city', 'country', 'page', 'limit'];

        if (!keyObj.every((key) => searchField.includes(key))) {
            return res.status(449).json({ error: "One of the fields cannot be used." });
        }

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        delete req.query.page;
        delete req.query.limit;

        if (keyObj.length !== 0) {
            await Hotel.findAndCountAll({
                attributes: [
                    'id',
                    'name',
                    'address',
                    'image',
                    'city',
                    'country',
                    'description',
                    'createdAt',
                ],
                where: param,
                limit: limit,
                offset: offset,
            }).then((resultat) => {
                const totalPages = Math.ceil(resultat.count / limit);

                return res.status(200).json({
                    success: {
                        hotels: resultat.rows,
                        totalCount: resultat.count,
                        totalPages: totalPages,
                        currentPage: page,
                    }
                });
            }).catch((err) => {
                console.log(err)
                return res.status(500).json({ error: "An error has occurred." });
            });
        } else {
            console.log("ici");
            return res.status(500).json({ error: "An error has occurred." });
        }
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: 'An error has occurred.' });
    }
}


async function createHotel(req, res){
    try {
        const { name, address, image, city, country, description } = req.body;

        await Hotel.create({
            name,
            address,
            image,
            city,
            country,
            description
        });

        res.status(201).json({ success: "Hotel created." });
    } catch (error) {
        console.error('Error creating hotel:', error);
        return res.status(500).json({ error: 'An error has occurred.' });
    }
}

async function updateHotel(req, res){
    try {
        const hotelId = req.params.id;
        const { name, address, image, city, country, description } = req.body;

        const hotel = await Hotel.findByPk(hotelId);
        if (hotel) {
            hotel.name = name || hotel.name;
            hotel.address = address || hotel.address;
            hotel.image = image || hotel.image;
            hotel.city = city || hotel.city;
            hotel.country = country || hotel.country;
            hotel.description = description || hotel.description;

            await hotel.save();
            res.status(200).json({ success: "Hotel updated." });
        } else {
            res.status(404).json({ error: 'Hotel not found.' });
        }
    } catch (error) {
        console.error('Error updating hotel:', error);
        return res.status(500).json({ error: 'An error has occurred.' });
    }
}

async function deleteHotel(req, res){
    try {
        const hotelId = req.params.id;
        const hotel = await User.findByPk(hotelId);
        if (hotel) {
            await hotel.destroy();
            res.status(200).json({ success: 'Hotel deleted.' });
        } else {
            res.status(404).json({ error: 'Hotel not found.' });
        }
    } catch (error) {
        console.error('Error deleting hotel:', error);
        return res.status(500).json({ error: 'An error has occurred.' });
    }

}

module.exports = {
    getHotelByField,
    createHotel,
    updateHotel,
    deleteHotel,
};

