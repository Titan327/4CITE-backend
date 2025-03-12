process.env.JWT_KEY = 'test-jwt-secret-key';

afterAll(async () => {
    const sequelize = require('sequelize');
    await sequelize.close();
});