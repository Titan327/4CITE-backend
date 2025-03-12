const request = require('supertest');
const express = require('express');
const bcrypt = require('bcrypt');

jest.mock('../models/user.model');
jest.mock('bcrypt');
jest.mock('../middlewares/jwt_auth.middleware', () => jest.fn((req, res, next) => {
  req.user = { id: 1, email: 'test@example.com', role: 'user' };
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

const User = require('../models/user.model');
const userRoutes = require('../routes/user.route');

const app = express();
app.use(express.json());
app.use('/api/user', userRoutes);

describe('User Controller Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/user/me', () => {
    test('devrait renvoyer les informations de l\'utilisateur connecté', async () => {
      const testUser = {
        id: 1,
        email: 'test@example.com',
        name: 'Test',
        surname: 'User',
        pseudo: 'testuser',
        role: 'user',
        active: true,
        createdAt: '2023-01-01T00:00:00.000Z',
        updatedAt: '2023-01-01T00:00:00.000Z'
      };

      User.findOne.mockResolvedValue(testUser);

      const response = await request(app)
          .get('/api/user/me');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ success: testUser });
      expect(User.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        attributes: [
          'id',
          'email',
          'name',
          'surname',
          'pseudo',
          'role',
          'active',
          'createdAt',
          'updatedAt',
        ]
      });
    });

    test('devrait gérer les erreurs lors de la récupération de l\'utilisateur', async () => {
      User.findOne.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
          .get('/api/user/me');

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'An error has occurred.' });
    });

    test('devrait gérer le cas où l\'utilisateur n\'est pas trouvé', async () => {
      User.findOne.mockResolvedValue(null);

      const response = await request(app)
          .get('/api/user/me');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ success: null });
    });
  });

  describe('PUT /api/user/me', () => {
    test('devrait mettre à jour les champs d\'un utilisateur', async () => {
      User.update.mockResolvedValue([1]);

      const updateData = {
        name: 'Updated Name',
        email: 'updated@example.com'
      };

      const response = await request(app)
          .put('/api/user/me')
          .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ success: 'User edit.' });
      expect(User.update).toHaveBeenCalledWith(
          updateData,
          { where: { id: 1 } }
      );
    });

    test('devrait hasher le mot de passe s\'il est mis à jour', async () => {
      User.update.mockResolvedValue([1]);
      bcrypt.hash.mockResolvedValue('hashedPassword123');

      const updateData = {
        password: 'NewPassword123!'
      };

      const response = await request(app)
          .put('/api/user/me')
          .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ success: 'User edit.' });
      expect(bcrypt.hash).toHaveBeenCalledWith('NewPassword123!', 10);
      expect(User.update).toHaveBeenCalledWith(
          { password: 'hashedPassword123' },
          { where: { id: 1 } }
      );
    });

    test('devrait rejeter les champs non autorisés', async () => {
      const updateData = {
        role: 'admin',
        name: 'Updated Name'
      };

      const response = await request(app)
          .put('/api/user/me')
          .send(updateData);

      expect(response.status).toBe(449);
      expect(response.body).toEqual({ error: 'One of the fields cannot be used.' });
      expect(User.update).not.toHaveBeenCalled();
    });

    test('devrait gérer les erreurs lors de la mise à jour', async () => {
      User.update.mockRejectedValue(new Error('Database error'));

      const updateData = {
        name: 'Updated Name'
      };

      const response = await request(app)
          .put('/api/user/me')
          .send(updateData);

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'An error has occurred.' });
    });
  });

  describe('DELETE /api/user/me', () => {
    test('devrait supprimer l\'utilisateur connecté', async () => {
      User.destroy.mockResolvedValue(1);

      const response = await request(app)
          .delete('/api/user/me');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ success: 'User deleted.' });
      expect(User.destroy).toHaveBeenCalledWith({
        where: { id: 1 }
      });
    });

    test('devrait gérer les erreurs lors de la suppression', async () => {
      User.destroy.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
          .delete('/api/user/me');

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'An error has occurred.' });
    });
  });

  describe('GET /api/user/search', () => {
    beforeEach(() => {
      const adminMiddleware = require('../middlewares/jwt_auth.middleware');
      adminMiddleware.mockImplementation((req, res, next) => {
        req.user = { id: 1, email: 'admin@example.com', role: 'admin' };
        next();
      });
    });

    test('devrait rechercher des utilisateurs par champ spécifique', async () => {
      const testUsers = [
        {
          id: 2,
          email: 'user2@example.com',
          name: 'User',
          surname: 'Two',
          pseudo: 'user2',
          role: 'user',
          active: true,
          createdAt: '2023-01-01T00:00:00.000Z'
        }
      ];

      User.findAll.mockResolvedValue(testUsers);

      const response = await request(app)
          .get('/api/user/search?email=user2@example.com');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ success: testUsers });
      expect(User.findAll).toHaveBeenCalledWith({
        attributes: [
          'id',
          'email',
          'name',
          'surname',
          'pseudo',
          'role',
          'active',
          'createdAt',
        ],
        where: { email: 'user2@example.com' }
      });
    });

    test('devrait rejeter les champs de recherche non autorisés', async () => {
      const response = await request(app)
          .get('/api/user/search?password=something');

      expect(response.status).toBe(449);
      expect(response.body).toEqual({ error: 'One of the fields cannot be used.' });
      expect(User.findAll).not.toHaveBeenCalled();
    });

    test('devrait gérer les erreurs lors de la recherche', async () => {
      User.findAll.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
          .get('/api/user/search?email=user2@example.com');

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'An error has occurred.' });
    });

    test('devrait échouer si aucun paramètre n\'est fourni', async () => {
      const response = await request(app)
          .get('/api/user/search');

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'An error has occurred.' });
      expect(User.findAll).not.toHaveBeenCalled();
    });
  });

  describe('PUT /api/user/:id', () => {
    beforeEach(() => {
      const adminMiddleware = require('../middlewares/jwt_auth.middleware');
      adminMiddleware.mockImplementation((req, res, next) => {
        req.user = { id: 1, email: 'admin@example.com', role: 'admin' };
        next();
      });

      jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    test('devrait mettre à jour un utilisateur spécifique', async () => {
      const mockUser = {
        id: 2,
        email: 'user2@example.com',
        name: 'User',
        surname: 'Two',
        pseudo: 'user2',
        save: jest.fn().mockResolvedValue(true)
      };

      User.findByPk.mockResolvedValue(mockUser);

      const updateData = {
        name: 'Updated Name',
        email: 'updated@example.com'
      };

      const response = await request(app)
          .put('/api/user/2')
          .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ message: 'User modified.' });
      expect(User.findByPk).toHaveBeenCalledWith('2');
      expect(mockUser.email).toBe(updateData.email);
      expect(mockUser.name).toBe(updateData.name);
      expect(mockUser.save).toHaveBeenCalled();
    });

    test('devrait gérer le cas où l\'utilisateur n\'existe pas', async () => {
      User.findByPk.mockResolvedValue(null);

      const response = await request(app)
          .put('/api/user/999')
          .send({ name: 'Updated Name' });

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ message: 'User not found.' });
    });

    test('devrait gérer les erreurs lors de la mise à jour', async () => {
      User.findByPk.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
          .put('/api/user/2')
          .send({ name: 'Updated Name' });

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'An error has occurred.' });
    });
  });

  describe('DELETE /api/user', () => {
    beforeEach(() => {
      const adminMiddleware = require('../middlewares/jwt_auth.middleware');
      adminMiddleware.mockImplementation((req, res, next) => {
        req.user = { id: 1, email: 'admin@example.com', role: 'admin' };
        next();
      });

      jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    test('devrait supprimer un utilisateur spécifique', async () => {
      const mockUser = {
        id: 2,
        email: 'user2@example.com',
        destroy: jest.fn().mockResolvedValue(true)
      };

      User.findByPk.mockResolvedValue(mockUser);

      const response = await request(app)
          .delete('/api/user/2');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ message: 'User deleted.' });
      expect(User.findByPk).toHaveBeenCalledWith('2');
      expect(mockUser.destroy).toHaveBeenCalled();
    });

    test('devrait gérer le cas où l\'utilisateur n\'existe pas', async () => {
      User.findByPk.mockResolvedValue(null);

      const response = await request(app)
          .delete('/api/user/999');

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ message: 'User not found.' });
    });

    test('devrait gérer les erreurs lors de la suppression', async () => {
      User.findByPk.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
          .delete('/api/user/2');

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'An error has occurred.' });
    });
  });
});