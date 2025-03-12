const Hotel = require('../models/hotel.model');
const User = require("../models/user.model");
const Room = require("../models/room.model");
require('dotenv').config();

async function getRoomByField(req, res) {
    try {
        const param = req.query;
        const keyObj = Object.keys(param);
        const searchField = ['id', 'hotel_id', 'type_room', 'max_nb_people', 'number_of_room', 'page', 'limit'];

        if (!keyObj.every((key) => searchField.includes(key))) {
            return res.status(449).json({ error: "One of the fields cannot be used." });
        }

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        delete req.query.page;
        delete req.query.limit;

        if (keyObj.length !== 0) {
            await Room.findAndCountAll({
                attributes: [
                    'id',
                    'hotel_id',
                    'type_room',
                    'max_nb_people',
                    'number_of_room',
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
                        rooms: resultat.rows,
                        totalCount: resultat.count,
                        totalPages: totalPages,
                        currentPage: page,
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

async function createRoom(req, res){
    try {
        const { hotel_id, type_room, max_nb_people, number_of_room, description } = req.body;

        await Room.create({
            hotel_id,
            type_room,
            max_nb_people,
            number_of_room,
            description
        });

        res.status(201).json({ success: "Room created." });
    } catch (error) {
        console.error('Error creating room:', error);
        return res.status(500).json({ error: 'An error has occurred.' });
    }
}

async function updateRoom(req, res){
    try {
        const roomId = req.params.id;
        const { hotel_id, type_room, max_nb_people, number_of_room, description } = req.body;

        const room = await Room.findByPk(roomId);
        if (room) {
            room.hotel_id = hotel_id || room.hotel_id;
            room.type_room = type_room || room.type_room;
            room.max_nb_people = max_nb_people || room.country;
            room.number_of_room = number_of_room || room.number_of_room;
            room.description = description || room.description;

            await room.save();
            res.status(200).json({ success: "Room updated." });
        } else {
            res.status(404).json({ error: 'Room not found.' });
        }
    } catch (error) {
        console.error('Error updating room:', error);
        return res.status(500).json({ error: 'An error has occurred.' });
    }
}

async function deleteRoom(req, res){
    try {
        const roomId = req.params.id;
        const room = await Room.findByPk(roomId);
        if (room) {
            await room.destroy();
            res.status(200).json({ success: 'Room deleted.' });
        } else {
            res.status(404).json({ error: 'Room not found.' });
        }
    } catch (error) {
        console.error('Error deleting Room:', error);
        return res.status(500).json({ error: 'An error has occurred.' });
    }

}

module.exports = {
    getRoomByField,
    createRoom,
    updateRoom,
    deleteRoom,
};
