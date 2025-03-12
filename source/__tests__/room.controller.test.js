const request = require('supertest');
const express = require('express');

jest.mock('../models/room.model');
jest.mock('../middlewares/jwt_auth.middleware', () => jest.fn((req, res, next) => {
    req.user = { id: 1, email: 'admin@example.com', role: 'admin' };
    next();
}));
jest.mock('../middlewares/check_role.middleware', () => ({
    isAdmin: jest.fn((req, res, next) => {
        if (req.user && req.user.role === 'admin') {
            next();
        } else {
            res.status(403).json({ error: 'Access denied' });
        }
    })
}));

const Room = require('../models/room.model');
const roomRoutes = require('../routes/room.route');

const app = express();
app.use(express.json());
app.use('/api/room', roomRoutes);

describe('Room Controller Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, 'error').mockImplementation(() => {});
        jest.spyOn(console, 'log').mockImplementation(() => {});
    });

    describe('GET /api/room/search', () => {
        test('devrait renvoyer des chambres filtrées par champ', async () => {
            const mockRooms = [
                {
                    id: 1,
                    hotel_id: 1,
                    type_room: 'Suite',
                    max_nb_people: 4,
                    number_of_room: 101,
                    description: 'A luxury suite',
                    createdAt: '2023-01-01T00:00:00.000Z'
                }
            ];

            Room.findAndCountAll.mockResolvedValue({
                count: 1,
                rows: mockRooms
            });

            const response = await request(app)
                .get('/api/room/search?type_room=Suite&limit=10&page=1');

            expect(response.status).toBe(200);
            expect(response.body).toEqual({
                success: {
                    rooms: mockRooms,
                    totalCount: 1,
                    totalPages: 1,
                    currentPage: 1
                }
            });
            expect(Room.findAndCountAll).toHaveBeenCalledWith({
                attributes: [
                    'id',
                    'hotel_id',
                    'type_room',
                    'max_nb_people',
                    'number_of_room',
                    'description',
                    'createdAt',
                ],
                where: { type_room: 'Suite' },
                limit: 10,
                offset: 0
            });
        });

        test('devrait rejeter les champs de recherche non autorisés', async () => {
            const response = await request(app)
                .get('/api/room/search?invalidField=test');

            expect(response.status).toBe(449);
            expect(response.body).toEqual({ error: 'One of the fields cannot be used.' });
            expect(Room.findAndCountAll).not.toHaveBeenCalled();
        });

        test('devrait utiliser les valeurs par défaut pour limit et page', async () => {
            Room.findAndCountAll.mockResolvedValue({
                count: 0,
                rows: []
            });

            const response = await request(app)
                .get('/api/room/search?max_nb_people=2');

            expect(response.status).toBe(200);
            expect(Room.findAndCountAll).toHaveBeenCalledWith({
                attributes: expect.any(Array),
                where: { max_nb_people: '2' },
                limit: 10,
                offset: 0
            });
        });

        test('devrait gérer les erreurs lors de la recherche', async () => {
            Room.findAndCountAll.mockRejectedValue(new Error('Database error'));

            const response = await request(app)
                .get('/api/room/search?type_room=Suite');

            expect(response.status).toBe(500);
            expect(response.body).toEqual({ error: 'An error has occurred.' });
        });

        test('devrait échouer si aucun paramètre n\'est fourni', async () => {
            const response = await request(app)
                .get('/api/room/search');

            expect(response.status).toBe(500);
            expect(response.body).toEqual({ error: 'An error has occurred.' });
            expect(Room.findAndCountAll).not.toHaveBeenCalled();
        });
    });

    describe('POST /api/room', () => {
        test('devrait créer une nouvelle chambre', async () => {
            Room.create.mockResolvedValue({});

            const roomData = {
                hotel_id: 1,
                type_room: 'Double',
                max_nb_people: 2,
                number_of_room: 202,
                description: 'A comfortable double room'
            };

            const response = await request(app)
                .post('/api/room')
                .send(roomData);

            expect(response.status).toBe(201);
            expect(response.body).toEqual({ success: 'Room created.' });
            expect(Room.create).toHaveBeenCalledWith(roomData);
        });

        test('devrait gérer les erreurs lors de la création', async () => {
            Room.create.mockRejectedValue(new Error('Database error'));

            const roomData = {
                hotel_id: 1,
                type_room: 'Double',
                max_nb_people: 2,
                number_of_room: 202,
                description: 'A comfortable double room'
            };

            const response = await request(app)
                .post('/api/room')
                .send(roomData);

            expect(response.status).toBe(500);
            expect(response.body).toEqual({ error: 'An error has occurred.' });
        });
    });

    describe('PUT /api/room/:id', () => {
        test('devrait mettre à jour une chambre existante', async () => {
            const mockRoom = {
                id: 1,
                hotel_id: 1,
                type_room: 'Single',
                max_nb_people: 1,
                number_of_room: 101,
                description: 'A simple single room',
                save: jest.fn().mockResolvedValue(true)
            };

            Room.findByPk.mockResolvedValue(mockRoom);

            const updateData = {
                type_room: 'Premium Single',
                description: 'An upgraded single room'
            };

            const response = await request(app)
                .put('/api/room/1')
                .send(updateData);

            expect(response.status).toBe(200);
            expect(response.body).toEqual({ success: 'Room updated.' });
            expect(Room.findByPk).toHaveBeenCalledWith('1');
            expect(mockRoom.type_room).toBe(updateData.type_room);
            expect(mockRoom.description).toBe(updateData.description);
            expect(mockRoom.hotel_id).toBe(1);
            expect(mockRoom.save).toHaveBeenCalled();
        });

        test('devrait gérer le cas où la chambre n\'existe pas', async () => {
            Room.findByPk.mockResolvedValue(null);

            const response = await request(app)
                .put('/api/room/999')
                .send({ type_room: 'Premium Single' });

            expect(response.status).toBe(404);
            expect(response.body).toEqual({ error: 'Room not found.' });
        });

        test('devrait gérer les erreurs lors de la mise à jour', async () => {
            Room.findByPk.mockRejectedValue(new Error('Database error'));

            const response = await request(app)
                .put('/api/room/1')
                .send({ type_room: 'Premium Single' });

            expect(response.status).toBe(500);
            expect(response.body).toEqual({ error: 'An error has occurred.' });
        });

        test('devrait identifier et signaler l\'erreur dans le code du contrôleur', async () => {
            const mockRoom = {
                id: 1,
                hotel_id: 1,
                type_room: 'Single',
                max_nb_people: 1,
                number_of_room: 101,
                description: 'A simple single room',
                save: jest.fn().mockImplementation(() => {
                    throw new Error('Cannot read property of undefined');
                })
            };

            Room.findByPk.mockResolvedValue(mockRoom);

            const updateData = {
                max_nb_people: 2
            };

            const response = await request(app)
                .put('/api/room/1')
                .send(updateData);

            expect(response.status).toBe(500);
            expect(response.body).toEqual({ error: 'An error has occurred.' });
        });
    });

    describe('DELETE /api/room/:id', () => {
        test('devrait supprimer une chambre existante', async () => {
            const mockRoom = {
                id: 1,
                destroy: jest.fn().mockResolvedValue(true)
            };

            Room.findByPk.mockResolvedValue(mockRoom);

            const response = await request(app)
                .delete('/api/room/1');

            expect(response.status).toBe(200);
            expect(response.body).toEqual({ success: 'Room deleted.' });
            expect(Room.findByPk).toHaveBeenCalledWith('1');
            expect(mockRoom.destroy).toHaveBeenCalled();
        });

        test('devrait gérer le cas où la chambre n\'existe pas', async () => {
            Room.findByPk.mockResolvedValue(null);

            const response = await request(app)
                .delete('/api/room/999');

            expect(response.status).toBe(404);
            expect(response.body).toEqual({ error: 'Room not found.' });
        });

        test('devrait gérer les erreurs lors de la suppression', async () => {
            Room.findByPk.mockRejectedValue(new Error('Database error'));

            const response = await request(app)
                .delete('/api/room/1');

            expect(response.status).toBe(500);
            expect(response.body).toEqual({ error: 'An error has occurred.' });
        });
    });
});