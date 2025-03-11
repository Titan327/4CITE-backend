const Booking = require("../models/booking.model");
require('dotenv').config();

async function getBookingByField(req, res) {
    try {
        const param = req.query;
        const keyObj = Object.keys(param);
        const searchField = [
            'id',
            'room_id',
            'user_id',
            'number_of_people',
            'date_in',
            'date_out',
            'paid',
            'active'
        ];

        if (!keyObj.every((key) => searchField.includes(key))) {
            return res.status(449).json({ error: "One of the fields cannot be used." });
        }

        if (req.user.role === "user" && req.user.role === ""){
            param.user_id = req.user.id;
        }

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        if (keyObj.length !== 0) {
            const Bookings = await Booking.findAndCountAll({
                attributes: [
                    'id',
                    'room_id',
                    'user_id',
                    'number_of_people',
                    'date_in',
                    'date_out',
                    'paid',
                    'active',
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
                        Bookings,
                        totalPages: totalPages
                    }
                });
            }).catch((err) => {
                return res.status(500).json({ error: "An error has occurred." });
            });
        } else {
            return res.status(500).json({ error: "An error has occurred." });
        }
    } catch (error) {
        return res.status(500).json({ error: 'An error has occurred.' });
    }
}

async function createBooking(req, res){
    try {
        const token_user = req.user;

        const { room_id, number_of_people, date_in, date_out, paid } = req.body;

        await Booking.create({
            room_id,
            user_id : token_user.id,
            number_of_people,
            date_in,
            date_out,
            paid,
            active: 1
        });

        res.status(201).json("Booking created.");
    } catch (error) {
        console.error('Error creating booking:', error);
        return res.status(500).json({ error: 'An error has occurred.' });
    }
}

async function updateBooking(req, res){
    try {


        const bookingId = req.params.id;
        const { room_id, user_id, number_of_people, date_in, date_out, paid } = req.body;

        const booking = await Booking.findByPk(bookingId);

        if (req.user.role === "user" && req.user.role === "" && booking.user_id !== req.user.id){
            return res.status(401).json({ message: "You are not authorized to access this." });
        }

        if (booking) {
            booking.room_id = room_id || booking.room_id;
            booking.user_id = user_id || booking.user_id;
            booking.number_of_people = number_of_people || booking.number_of_people;
            booking.date_in = date_in || booking.date_in;
            booking.date_out = date_out || booking.date_out;
            booking.paid = paid || booking.paid;

            await booking.save();
            res.status(200).json("Booking updated.");
        } else {
            res.status(404).json({ message: 'Booking not found.' });
        }
    } catch (error) {
        console.error('Error updating booking:', error);
        return res.status(500).json({ error: 'An error has occurred.' });
    }
}

async function deleteBooking(req, res){
    try {
        const bookingId = req.params.id;
        const booking = await Booking.findByPk(bookingId);

        if (req.user.role === "user" && req.user.role === "" && booking.user_id !== req.user.id){
            return res.status(401).json({ message: "You are not authorized to access this." });
        }

        if (booking) {
            await booking.destroy();
            res.status(200).json({ message: 'Booking deleted.' });
        } else {
            res.status(404).json({ message: 'Booking not found.' });
        }
    } catch (error) {
        console.error('Error deleting booking:', error);
        return res.status(500).json({ error: 'An error has occurred.' });
    }
}


module.exports = {
    getBookingByField,
    createBooking,
    updateBooking,
    deleteBooking,
};
