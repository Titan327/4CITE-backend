const router = require('express').Router();
const AuthController = require('../controllers/auth.controller');
//const authenticateToken = require('../middlewares/jwt_auth.middleware');
//const check_role = require('../middlewares/check_role.middlewares');

//PUBLIC
//POST /api/auth/register
router.post("/register",AuthController.register);
//GET /api/auth/login
router.post("/login",AuthController.login);
//PUT /api/user/setpublic
//router.put("/setpublic",authenticateToken,UserController.setPublicParam);

module.exports = router;
