const router = require('express').Router();
const UserController = require('../controllers/user.controller');
//const authenticateToken = require('../middlewares/jwt_auth.middleware');
//const check_role = require('../middlewares/check_role.middlewares');

//PUBLIC
//GET /api/user/search
//router.get("/search",authenticateToken,UserController.findUserByUsername);
//PUT /api/user/setpublic
//router.put("/setpublic",authenticateToken,UserController.setPublicParam);


module.exports = router;
