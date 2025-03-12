const authenticateToken = jest.fn((req, res, next) => {
    req.user = {
        id: 1,
        email: 'test@example.com',
        name: 'Test',
        surname: 'User',
        pseudo: 'testuser',
        role: 'user'
    };

    next();
});

module.exports = authenticateToken;