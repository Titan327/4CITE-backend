const check_role = {
    isAdmin: jest.fn((req, res, next) => {
        next();
    }),

    isUser: jest.fn((req, res, next) => {
        next();
    })
};

module.exports = check_role;