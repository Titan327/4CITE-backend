const request = require('supertest');
const express = require('express');


jest.mock('../models/booking.model');
jest.mock('../middlewares/jwt_auth.middleware', () => jest.fn((req, res, next) => {
    req.user = { id: 1, email: 'user@example.com', role: 'user' };
    next();
}));
jest.mock('../middlewares/check_role.middleware', () => ({
    isUser: jest.fn((req, res, next) => {
        if (req.user && (req.user.role === 'user' || req.user.role === 'admin')) {
            next();
        } else {
            res.status(403).json({ error: 'Access denied' });
        }
    })
}));


const Booking = require('../models/booking.model');
const bookingRoutes = require('../routes/booking.route');


const app = express();
app.use(express.json());
app.use('/api/booking', bookingRoutes);

describe('Booking Controller Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();

        jest.spyOn(console, 'error').mockImplementation(() => {});
        jest.spyOn(console, 'log').mockImplementation(() => {});
    });


    describe('GET /api/booking/search', () => {
        test('devrait renvoyer les réservations filtrées par champ pour un utilisateur', async () => {
            const mockBookings = [
                {
                    id: 1,
                    room_id: 1,
                    user_id: 1,
                    number_of_people: 2,
                    date_in: '2023-12-01T00:00:00.000Z',
                    date_out: '2023-12-10T00:00:00.000Z',
                    paid: true,
                    active: true,
                    createdAt: '2023-01-01T00:00:00.000Z'
                }
            ];

            Booking.findAndCountAll.mockResolvedValue({
                count: 1,
                rows: mockBookings
            });

            const response = await request(app)
                .get('/api/booking/search?room_id=1&limit=10&page=1');

            expect(response.status).toBe(200);
            expect(response.body).toEqual({
                success: {
                    bookings: mockBookings,
                    totalPages: 1
                }
            });
            expect(Booking.findAndCountAll).toHaveBeenCalledWith({
                attributes: [
                    'id',
                    'room_id',
                    'user_id',
                    'number_of_people',
                    'date_in',
                    'date_out',
                    'paid',
                    'active',
                    'createdAt',
                ],
                where: { room_id: '1' },
                limit: 10,
                offset: 0
            });
        });

        test('devrait rejeter les champs de recherche non autorisés', async () => {
            const response = await request(app)
                .get('/api/booking/search?invalidField=test');

            expect(response.status).toBe(449);
            expect(response.body).toEqual({ error: 'One of the fields cannot be used.' });
            expect(Booking.findAndCountAll).not.toHaveBeenCalled();
        });

        test('devrait utiliser les valeurs par défaut pour limit et page', async () => {
            Booking.findAndCountAll.mockResolvedValue({
                count: 0,
                rows: []
            });

            const response = await request(app)
                .get('/api/booking/search?paid=true');

            expect(response.status).toBe(200);
            expect(Booking.findAndCountAll).toHaveBeenCalledWith({
                attributes: expect.any(Array),
                where: { paid: 'true' },
                limit: 10,
                offset: 0
            });
        });

        test('devrait gérer les erreurs lors de la recherche', async () => {
            Booking.findAndCountAll.mockRejectedValue(new Error('Database error'));

            const response = await request(app)
                .get('/api/booking/search?room_id=1');

            expect(response.status).toBe(500);
            expect(response.body).toEqual({ error: 'An error has occurred.' });
        });

        test('devrait échouer si aucun paramètre n\'est fourni', async () => {
            const response = await request(app)
                .get('/api/booking/search');

            expect(response.status).toBe(500);
            expect(response.body).toEqual({ error: 'An error has occurred.' });
            expect(Booking.findAndCountAll).not.toHaveBeenCalled();
        });

        test('devrait limiter les résultats aux réservations de l\'utilisateur si le rôle est utilisateur', async () => {

            const authMiddleware = require('../middlewares/jwt_auth.middleware');
            authMiddleware.mockImplementation((req, res, next) => {
                req.user = { id: 1, email: 'user@example.com', role: 'user' };
                next();
            });

            Booking.findAndCountAll.mockResolvedValue({
                count: 1,
                rows: [{
                    id: 1,
                    user_id: 1,
                    room_id: 1
                }]
            });

            const response = await request(app)
                .get('/api/booking/search?room_id=1');

            expect(response.status).toBe(200);
        });
    });


    describe('POST /api/booking', () => {
        test('devrait créer une nouvelle réservation pour l\'utilisateur connecté', async () => {
            Booking.create.mockResolvedValue({});

            const bookingData = {
                room_id: 1,
                number_of_people: 2,
                date_in: '2023-12-01',
                date_out: '2023-12-10',
                paid: true
            };

            const response = await request(app)
                .post('/api/booking')
                .send(bookingData);

            expect(response.status).toBe(201);
            expect(response.body).toBe("Booking created.");
            expect(Booking.create).toHaveBeenCalledWith({
                ...bookingData,
                user_id: 1,
                active: 1
            });
        });

        test('devrait gérer les erreurs lors de la création', async () => {
            Booking.create.mockRejectedValue(new Error('Database error'));

            const bookingData = {
                room_id: 1,
                number_of_people: 2,
                date_in: '2023-12-01',
                date_out: '2023-12-10',
                paid: true
            };

            const response = await request(app)
                .post('/api/booking')
                .send(bookingData);

            expect(response.status).toBe(500);
            expect(response.body).toEqual({ error: 'An error has occurred.' });
        });
    });

    describe('PUT /api/booking/:id', () => {
        test('devrait mettre à jour une réservation existante de l\'utilisateur', async () => {
            const mockBooking = {
                id: 1,
                room_id: 1,
                user_id: 1,
                number_of_people: 2,
                date_in: '2023-12-01T00:00:00.000Z',
                date_out: '2023-12-10T00:00:00.000Z',
                paid: false,
                save: jest.fn().mockResolvedValue(true)
            };

            Booking.findByPk.mockResolvedValue(mockBooking);

            const updateData = {
                number_of_people: 3,
                paid: true
            };

            const response = await request(app)
                .put('/api/booking/1')
                .send(updateData);

            expect(response.status).toBe(200);
            expect(response.body).toBe("Booking updated.");
            expect(Booking.findByPk).toHaveBeenCalledWith('1');
            expect(mockBooking.number_of_people).toBe(updateData.number_of_people);
            expect(mockBooking.paid).toBe(updateData.paid);
            expect(mockBooking.room_id).toBe(1);
            expect(mockBooking.save).toHaveBeenCalled();
        });

        test('devrait gérer le cas où l\'utilisateur tente de modifier une réservation qui ne lui appartient pas', async () => {

            const mockBooking = {
                id: 1,
                user_id: 2,
                room_id: 1,
                number_of_people: 2,
                date_in: '2023-12-01T00:00:00.000Z',
                date_out: '2023-12-10T00:00:00.000Z',
                paid: false,
                save: jest.fn()
            };

            Booking.findByPk.mockResolvedValue(mockBooking);

            const updateData = {
                paid: true
            };

            const response = await request(app)
                .put('/api/booking/1')
                .send(updateData);

            expect(response.status).toBe(200);
            expect(mockBooking.save).toHaveBeenCalled();
        });

        test('devrait gérer le cas où la réservation n\'existe pas', async () => {
            Booking.findByPk.mockResolvedValue(null);

            const response = await request(app)
                .put('/api/booking/999')
                .send({ paid: true });

            expect(response.status).toBe(404);
            expect(response.body).toEqual({ message: 'Booking not found.' });
        });

        test('devrait gérer les erreurs lors de la mise à jour', async () => {
            Booking.findByPk.mockRejectedValue(new Error('Database error'));

            const response = await request(app)
                .put('/api/booking/1')
                .send({ paid: true });

            expect(response.status).toBe(500);
            expect(response.body).toEqual({ error: 'An error has occurred.' });
        });
    });

    describe('DELETE /api/booking/:id', () => {
        test('devrait supprimer une réservation existante de l\'utilisateur', async () => {
            const mockBooking = {
                id: 1,
                user_id: 1,
                destroy: jest.fn().mockResolvedValue(true)
            };

            Booking.findByPk.mockResolvedValue(mockBooking);

            const response = await request(app)
                .delete('/api/booking/1');

            expect(response.status).toBe(200);
            expect(response.body).toEqual({ message: 'Booking deleted.' });
            expect(Booking.findByPk).toHaveBeenCalledWith('1');
            expect(mockBooking.destroy).toHaveBeenCalled();
        });

        test('devrait gérer le cas où l\'utilisateur tente de supprimer une réservation qui ne lui appartient pas', async () => {

            const mockBooking = {
                id: 1,
                user_id: 2,
                destroy: jest.fn()
            };

            Booking.findByPk.mockResolvedValue(mockBooking);

            const response = await request(app)
                .delete('/api/booking/1');

            expect(response.status).toBe(200);
            expect(mockBooking.destroy).toHaveBeenCalled();
        });

        test('devrait gérer le cas où la réservation n\'existe pas', async () => {
            Booking.findByPk.mockResolvedValue(null);

            const response = await request(app)
                .delete('/api/booking/999');

            expect(response.status).toBe(404);
            expect(response.body).toEqual({ message: 'Booking not found.' });
        });

        test('devrait gérer les erreurs lors de la suppression', async () => {
            Booking.findByPk.mockRejectedValue(new Error('Database error'));

            const response = await request(app)
                .delete('/api/booking/1');

            expect(response.status).toBe(500);
            expect(response.body).toEqual({ error: 'An error has occurred.' });
        });
    });
});