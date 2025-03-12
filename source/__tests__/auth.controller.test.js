// __tests__/auth.controller.test.js
const request = require('supertest');
const express = require('express');
const User = require('../models/user.model');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: '.env.test' }); // Utiliser les variables d'environnement de test

// Configuration de l'application Express pour les tests
const app = express();
app.use(express.json());

// Import des routes d'authentification
const authRoutes = require('../routes/auth.routes'); // Ajustez le chemin selon votre structure
app.use('/api/auth', authRoutes);

// Si vous avez une configuration spécifique pour la base de données de test
const { sequelize } = require('../config/database'); // Ajustez selon votre structure de projet

describe('AuthController', () => {
    // Avant tous les tests, synchroniser la base de données
    beforeAll(async () => {
        // Forcer la synchronisation pour recréer les tables à chaque lancement
        await sequelize.sync({ force: true });
    });

    // Après tous les tests, fermer la connexion à la base de données
    afterAll(async () => {
        await sequelize.close();
    });

    // Avant chaque test, nettoyer les tables
    beforeEach(async () => {
        await User.destroy({ where: {}, truncate: true });
    });

    describe('register', () => {
        test('devrait enregistrer un nouvel utilisateur avec succès', async () => {
            const userData = {
                name: 'John',
                surname: 'Doe',
                pseudo: 'johndoe',
                email: 'john@example.com',
                password: 'Password1@'
            };

            const response = await request(app)
                .post('/api/auth/register')
                .send(userData)
                .set('Accept', 'application/json');

            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty('success', 'Registered user.');

            // Vérifier que l'utilisateur a été créé dans la base de données
            const user = await User.findOne({ where: { email: userData.email } });
            expect(user).not.toBeNull();
            expect(user.name).toBe(userData.name);
            expect(user.pseudo).toBe(userData.pseudo);
            expect(user.role).toBe('user');
            expect(user.active).toBe(1);

            // Vérifier que le mot de passe a été hashé (il ne doit pas être en clair)
            expect(user.password).not.toBe(userData.password);
        });

        test('devrait retourner une erreur si l\'email est déjà utilisé', async () => {
            // Créer d'abord un utilisateur
            await User.create({
                name: 'John',
                surname: 'Doe',
                pseudo: 'johndoe',
                email: 'john@example.com',
                password: await bcrypt.hash('Password1@', 10),
                role: 'user',
                active: 1
            });

            // Essayer de créer un utilisateur avec le même email
            const userData = {
                name: 'Jane',
                surname: 'Smith',
                pseudo: 'janesmith',
                email: 'john@example.com', // Même email
                password: 'Password2@'
            };

            const response = await request(app)
                .post('/api/auth/register')
                .send(userData)
                .set('Accept', 'application/json');

            expect(response.status).toBe(449);
            expect(response.body).toHaveProperty('error', 'Email already used.');

            // Vérifier qu'un seul utilisateur existe avec cet email
            const users = await User.findAll({ where: { email: userData.email } });
            expect(users.length).toBe(1);
        });

        test('devrait valider la longueur du nom', async () => {
            const userData = {
                name: 'A'.repeat(51), // Nom trop long
                surname: 'Doe',
                pseudo: 'johndoe',
                email: 'john@example.com',
                password: 'Password1@'
            };

            const response = await request(app)
                .post('/api/auth/register')
                .send(userData)
                .set('Accept', 'application/json');

            expect(response.status).toBe(449);
            expect(response.body).toHaveProperty('error', 'Name must be less than 50 character.');

            // Vérifier qu'aucun utilisateur n'a été créé
            const user = await User.findOne({ where: { email: userData.email } });
            expect(user).toBeNull();
        });

        // Ajouter les autres tests de validation...

        test('devrait valider la complexité du mot de passe', async () => {
            const userData = {
                name: 'John',
                surname: 'Doe',
                pseudo: 'johndoe',
                email: 'john@example.com',
                password: 'password' // Mot de passe trop simple
            };

            const response = await request(app)
                .post('/api/auth/register')
                .send(userData)
                .set('Accept', 'application/json');

            expect(response.status).toBe(449);
            expect(response.body).toHaveProperty('error', 'The password must contain at least one lowercase letter, one uppercase letter, one digit, and one special character.');
        });
    });

    describe('login', () => {
        test('devrait connecter un utilisateur avec succès', async () => {
            // Créer d'abord un utilisateur pour le test
            const password = 'Password1@';
            const hashedPassword = await bcrypt.hash(password, 10);

            await User.create({
                name: 'John',
                surname: 'Doe',
                pseudo: 'johndoe',
                email: 'john@example.com',
                password: hashedPassword,
                role: 'user',
                active: 1
            });

            // Tenter de se connecter
            const loginData = {
                email: 'john@example.com',
                password: password
            };

            const response = await request(app)
                .post('/api/auth/login')
                .send(loginData)
                .set('Accept', 'application/json');

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('token');

            // Vérifier que le token est valide
            const decoded = jwt.verify(response.body.token, process.env.JWT_KEY);
            expect(decoded).toHaveProperty('email', loginData.email);
            expect(decoded).toHaveProperty('role', 'user');
        });

        test('devrait rejeter la connexion avec un mot de passe incorrect', async () => {
            // Créer d'abord un utilisateur pour le test
            const password = 'Password1@';
            const hashedPassword = await bcrypt.hash(password, 10);

            await User.create({
                name: 'John',
                surname: 'Doe',
                pseudo: 'johndoe',
                email: 'john@example.com',
                password: hashedPassword,
                role: 'user',
                active: 1
            });

            // Tenter de se connecter avec un mauvais mot de passe
            const loginData = {
                email: 'john@example.com',
                password: 'WrongPassword1@'
            };

            const response = await request(app)
                .post('/api/auth/login')
                .send(loginData)
                .set('Accept', 'application/json');

            expect(response.status).toBe(449);
            expect(response.body).toHaveProperty('error', 'Wrong password or email.');
        });

        test('devrait gérer le cas où l\'utilisateur n\'existe pas', async () => {
            const loginData = {
                email: 'nonexistent@example.com',
                password: 'Password1@'
            };

            // Dans votre contrôleur actuel, cela générerait une erreur car
            // user serait null lorsque vous essayez d'accéder à user["password"]
            // Vous pourriez améliorer votre contrôleur pour vérifier si user existe d'abord

            const response = await request(app)
                .post('/api/auth/login')
                .send(loginData)
                .set('Accept', 'application/json');

            // Avec votre code actuel, cela devrait retourner une erreur 500
            expect(response.status).toBe(500);
            expect(response.body).toHaveProperty('error', 'An error has occurred');
        });
    });
});