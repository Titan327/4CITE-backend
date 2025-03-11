const router = require('express').Router();
const UserController = require('../controllers/user.controller');
const authenticateToken = require('../middlewares/jwt_auth.middleware');


//PUBLIC
//GET /api/user/search?field={field}
router.get("/search",authenticateToken,UserController.GetUserByField);

//PRIVATE
//GET /api/user/me
router.get("/me",authenticateToken,UserController.getMe);
//PUT /api/user/me
router.put("/me",authenticateToken,UserController.updateMe);
//DELETE /api/user/me
router.delete("/me",authenticateToken,UserController.deleteMe);

module.exports = router;
