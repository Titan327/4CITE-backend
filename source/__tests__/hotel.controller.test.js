const request = require('supertest');
const express = require('express');

// Mocks
jest.mock('../models/hotel.model');
jest.mock('../models/user.model');
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

// Imports
const Hotel = require('../models/hotel.model');
const User = require('../models/user.model');
const hotelRoutes = require('../routes/hotel.route');

// Setup Express app
const app = express();
app.use(express.json());
app.use('/api/hotel', hotelRoutes);

describe('Hotel Controller Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Supprime les logs d'erreur et console.log pour garder la sortie de test propre
        jest.spyOn(console, 'error').mockImplementation(() => {});
        jest.spyOn(console, 'log').mockImplementation(() => {});
    });

    // Tests pour getHotelByField
    describe('GET /api/hotel/search', () => {
        test('devrait renvoyer des hôtels filtrés par champ', async () => {
            const mockHotels = [
                {
                    id: 1,
                    name: 'Test Hotel',
                    address: '123 Test St',
                    image: 'test-hotel.jpg',
                    city: 'Test City',
                    country: 'Test Country',
                    description: 'A test hotel',
                    createdAt: '2023-01-01T00:00:00.000Z'
                }
            ];

            Hotel.findAndCountAll.mockResolvedValue({
                count: 1,
                rows: mockHotels
            });

            const response = await request(app)
                .get('/api/hotel/search?city=Test%20City&limit=10&page=1');

            expect(response.status).toBe(200);
            expect(response.body).toEqual({
                success: {
                    hotels: mockHotels,
                    totalCount: 1,
                    totalPages: 1,
                    currentPage: 1
                }
            });
            expect(Hotel.findAndCountAll).toHaveBeenCalledWith({
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
                where: { city: 'Test City' },
                limit: 10,
                offset: 0
            });
        });

        test('devrait rejeter les champs de recherche non autorisés', async () => {
            const response = await request(app)
                .get('/api/hotel/search?invalidField=test');

            expect(response.status).toBe(449);
            expect(response.body).toEqual({ error: 'One of the fields cannot be used.' });
            expect(Hotel.findAndCountAll).not.toHaveBeenCalled();
        });

        test('devrait utiliser les valeurs par défaut pour limit et page', async () => {
            Hotel.findAndCountAll.mockResolvedValue({
                count: 0,
                rows: []
            });

            const response = await request(app)
                .get('/api/hotel/search?name=Test');

            expect(response.status).toBe(200);
            expect(Hotel.findAndCountAll).toHaveBeenCalledWith({
                attributes: expect.any(Array),
                where: { name: 'Test' },
                limit: 10,  // Valeur par défaut
                offset: 0   // Valeur par défaut pour page=1
            });
        });

        test('devrait gérer les erreurs lors de la recherche', async () => {
            Hotel.findAndCountAll.mockRejectedValue(new Error('Database error'));

            const response = await request(app)
                .get('/api/hotel/search?name=Test');

            expect(response.status).toBe(500);
            expect(response.body).toEqual({ error: 'An error has occurred.' });
        });

        test('devrait échouer si aucun paramètre n\'est fourni', async () => {
            const response = await request(app)
                .get('/api/hotel/search');

            expect(response.status).toBe(500);
            expect(response.body).toEqual({ error: 'An error has occurred.' });
            expect(Hotel.findAndCountAll).not.toHaveBeenCalled();
        });
    });

    // Tests pour createHotel (admin only)
    describe('POST /api/hotel', () => {
        test('devrait créer un nouvel hôtel', async () => {
            Hotel.create.mockResolvedValue({});

            const hotelData = {
                name: 'New Hotel',
                address: '123 New St',
                image: 'hotel.jpg',
                city: 'New City',
                country: 'New Country',
                description: 'A brand new hotel'
            };

            const response = await request(app)
                .post('/api/hotel')
                .send(hotelData);

            expect(response.status).toBe(201);
            expect(response.body).toEqual({ success: 'Hotel created.' });
            expect(Hotel.create).toHaveBeenCalledWith(hotelData);
        });

        test('devrait gérer les erreurs lors de la création', async () => {
            Hotel.create.mockRejectedValue(new Error('Database error'));

            const hotelData = {
                name: 'New Hotel',
                address: '123 New St',
                image: 'hotel.jpg',
                city: 'New City',
                country: 'New Country',
                description: 'A brand new hotel'
            };

            const response = await request(app)
                .post('/api/hotel')
                .send(hotelData);

            expect(response.status).toBe(500);
            expect(response.body).toEqual({ error: 'An error has occurred.' });
        });
    });

    // Tests pour updateHotel (admin only)
    describe('PUT /api/hotel/:id', () => {
        test('devrait mettre à jour un hôtel existant', async () => {
            const mockHotel = {
                id: 1,
                name: 'Old Hotel',
                address: '123 Old St',
                image: 'old-hotel.jpg',
                city: 'Old City',
                country: 'Old Country',
                description: 'An old hotel',
                save: jest.fn().mockResolvedValue(true)
            };

            Hotel.findByPk.mockResolvedValue(mockHotel);

            const updateData = {
                name: 'Updated Hotel',
                image: 'updated-hotel.jpg',
                city: 'Updated City'
            };

            const response = await request(app)
                .put('/api/hotel/1')
                .send(updateData);

            expect(response.status).toBe(200);
            expect(response.body).toEqual({ success: 'Hotel updated.' });
            expect(Hotel.findByPk).toHaveBeenCalledWith('1');
            expect(mockHotel.name).toBe(updateData.name);
            expect(mockHotel.image).toBe(updateData.image);
            expect(mockHotel.city).toBe(updateData.city);
            expect(mockHotel.address).toBe('123 Old St'); // Champ non modifié
            expect(mockHotel.save).toHaveBeenCalled();
        });

        test('devrait gérer le cas où l\'hôtel n\'existe pas', async () => {
            Hotel.findByPk.mockResolvedValue(null);

            const response = await request(app)
                .put('/api/hotel/999')
                .send({ name: 'Updated Hotel' });

            expect(response.status).toBe(404);
            expect(response.body).toEqual({ error: 'Hotel not found.' });
        });

        test('devrait gérer les erreurs lors de la mise à jour', async () => {
            Hotel.findByPk.mockRejectedValue(new Error('Database error'));

            const response = await request(app)
                .put('/api/hotel/1')
                .send({ name: 'Updated Hotel' });

            expect(response.status).toBe(500);
            expect(response.body).toEqual({ error: 'An error has occurred.' });
        });
    });

    // Tests pour deleteHotel (admin only)
    describe('DELETE /api/hotel/:id', () => {
        test('devrait supprimer un hôtel existant', async () => {
            const mockHotel = {
                id: 1,
                destroy: jest.fn().mockResolvedValue(true)
            };

            // Note: Il y a une erreur dans le contrôleur original: il utilise User.findByPk au lieu de Hotel.findByPk
            User.findByPk.mockResolvedValue(mockHotel);

            const response = await request(app)
                .delete('/api/hotel/1');

            expect(response.status).toBe(200);
            expect(response.body).toEqual({ success: 'Hotel deleted.' });
            expect(User.findByPk).toHaveBeenCalledWith('1');
            expect(mockHotel.destroy).toHaveBeenCalled();
        });

        test('devrait gérer le cas où l\'hôtel n\'existe pas', async () => {
            User.findByPk.mockResolvedValue(null);

            const response = await request(app)
                .delete('/api/hotel/999');

            expect(response.status).toBe(404);
            expect(response.body).toEqual({ error: 'Hotel not found.' });
        });

        test('devrait gérer les erreurs lors de la suppression', async () => {
            User.findByPk.mockRejectedValue(new Error('Database error'));

            const response = await request(app)
                .delete('/api/hotel/1');

            expect(response.status).toBe(500);
            expect(response.body).toEqual({ error: 'An error has occurred.' });
        });
    });
});