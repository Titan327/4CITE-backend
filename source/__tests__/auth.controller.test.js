const request = require('supertest');
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

jest.mock('../models/user.model');
jest.mock('bcrypt');
jest.mock('jsonwebtoken');

const User = require('../models/user.model');
const authRoutes = require('../routes/auth.route');

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

describe('Auth Controller Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('POST /api/auth/register', () => {
        test('devrait créer un nouvel utilisateur avec succès', async () => {
            User.findOne.mockResolvedValue(null)
            User.create.mockResolvedValue({});
            bcrypt.hash.mockResolvedValue('hashedPassword123');

            const userData = {
                email: 'test@example.com',
                pseudo: 'testuser',
                password: 'Password1!',
                name: 'Test',
                surname: 'User',
            };

            const response = await request(app)
                .post('/api/auth/register')
                .send(userData);

            expect(response.status).toBe(201);
            expect(response.body).toEqual({ success: 'Registered user.' });
            expect(User.findOne).toHaveBeenCalledWith({
                where: { email: userData.email },
            });
            expect(bcrypt.hash).toHaveBeenCalledWith(userData.password, 10);
            expect(User.create).toHaveBeenCalledWith({
                email: userData.email,
                pseudo: userData.pseudo,
                password: 'hashedPassword123',
                name: userData.name,
                surname: userData.surname,
                role: 'user',
                active: 1,
            });
        });

        test('devrait retourner une erreur si l\'email est déjà utilisé', async () => {
            User.findOne.mockResolvedValue({ id: 1, email: 'test@example.com' });

            const userData = {
                email: 'test@example.com',
                pseudo: 'testuser',
                password: 'Password1!',
                name: 'Test',
                surname: 'User',
            };

            const response = await request(app)
                .post('/api/auth/register')
                .send(userData);

            expect(response.status).toBe(449);
            expect(response.body).toEqual({ error: 'Email already used.' });
            expect(User.findOne).toHaveBeenCalledWith({
                where: { email: userData.email },
            });
            expect(User.create).not.toHaveBeenCalled();
        });

        test('devrait valider la longueur du nom', async () => {
            const userData = {
                email: 'test@example.com',
                pseudo: 'testuser',
                password: 'Password1!',
                name: 'A'.repeat(51),
                surname: 'User',
            };

            const response = await request(app)
                .post('/api/auth/register')
                .send(userData);

            expect(response.status).toBe(449);
            expect(response.body).toEqual({ error: 'Name must be less than 50 character.' });
            expect(User.findOne).not.toHaveBeenCalled();
        });

        test('devrait valider la longueur du pseudo', async () => {
            const userData = {
                email: 'test@example.com',
                pseudo: 'A'.repeat(21),
                password: 'Password1!',
                name: 'Test',
                surname: 'User',
            };

            const response = await request(app)
                .post('/api/auth/register')
                .send(userData);

            expect(response.status).toBe(449);
            expect(response.body).toEqual({ error: 'Pseudo must be less than 20 character.' });
        });

        test('devrait valider le format du mot de passe', async () => {
            const userData = {
                email: 'test@example.com',
                pseudo: 'testuser',
                password: 'password',
                name: 'Test',
                surname: 'User',
            };

            const response = await request(app)
                .post('/api/auth/register')
                .send(userData);

            expect(response.status).toBe(449);
            expect(response.body).toEqual({
                error: 'The password must contain at least one lowercase letter, one uppercase letter, one digit, and one special character.'
            });
        });

        test('devrait gérer les erreurs serveur lors de l\'inscription', async () => {
            User.findOne.mockRejectedValue(new Error('Database error'));

            const userData = {
                email: 'test@example.com',
                pseudo: 'testuser',
                password: 'Password1!',
                name: 'Test',
                surname: 'User',
            };

            const response = await request(app)
                .post('/api/auth/register')
                .send(userData);

            expect(response.status).toBe(500);
            expect(response.body).toEqual({ error: 'An error has occurred' });
        });
    });

    describe('POST /api/auth/login', () => {
        test('devrait connecter un utilisateur avec succès et retourner un token', async () => {
            const testUser = {
                id: 1,
                email: 'test@example.com',
                name: 'Test',
                surname: 'User',
                pseudo: 'testuser',
                password: 'hashedPassword123',
                role: 'user',
            };

            User.findOne.mockResolvedValue(testUser);
            bcrypt.compare.mockResolvedValue(true);
            jwt.sign.mockReturnValue('fake-jwt-token');

            process.env.JWT_KEY = 'test-jwt-key';

            const loginData = {
                email: 'test@example.com',
                password: 'Password1!',
            };

            const response = await request(app)
                .post('/api/auth/login')
                .send(loginData);

            expect(response.status).toBe(200);
            expect(response.body).toEqual({ token: 'fake-jwt-token' });
            expect(User.findOne).toHaveBeenCalledWith({
                where: { email: loginData.email },
            });
            expect(bcrypt.compare).toHaveBeenCalledWith(loginData.password, testUser.password);
            expect(jwt.sign).toHaveBeenCalledWith(
                {
                    id: testUser.id,
                    email: testUser.email,
                    name: testUser.name,
                    surname: testUser.surname,
                    pseudo: testUser.pseudo,
                    role: testUser.role,
                },
                'test-jwt-key'
            );
        });

        test('devrait refuser la connexion avec un email non existant', async () => {
            User.findOne.mockResolvedValue(null); // Aucun utilisateur trouvé

            const loginData = {
                email: 'nonexistent@example.com',
                password: 'Password1!',
            };

            const response = await request(app)
                .post('/api/auth/login')
                .send(loginData);

            expect(response.status).toBe(449);
            expect(response.body).toEqual({ error: 'Wrong password or email.' });
            expect(bcrypt.compare).not.toHaveBeenCalled();
            expect(jwt.sign).not.toHaveBeenCalled();
        });

        test('devrait refuser la connexion avec un mot de passe incorrect', async () => {
            const testUser = {
                id: 1,
                email: 'test@example.com',
                password: 'hashedPassword123',
            };

            User.findOne.mockResolvedValue(testUser);
            bcrypt.compare.mockResolvedValue(false);

            const loginData = {
                email: 'test@example.com',
                password: 'WrongPassword1!',
            };

            const response = await request(app)
                .post('/api/auth/login')
                .send(loginData);

            expect(response.status).toBe(449);
            expect(response.body).toEqual({ error: 'Wrong password or email.' });
            expect(bcrypt.compare).toHaveBeenCalledWith(loginData.password, testUser.password);
            expect(jwt.sign).not.toHaveBeenCalled();
        });

        test('devrait gérer les erreurs serveur lors de la connexion', async () => {
            jest.spyOn(console, 'error').mockImplementation(() => {});
            jest.spyOn(console, 'log').mockImplementation(() => {});
            User.findOne.mockRejectedValue(new Error('Database error'));

            const loginData = {
                email: 'test@example.com',
                password: 'Password1!',
            };

            const response = await request(app)
                .post('/api/auth/login')
                .send(loginData);

            expect(response.status).toBe(500);
            expect(response.body).toEqual({ error: 'An error has occurred' });
        });
    });
});