const router = require('express').Router();
const UserController = require('../controllers/user.controller');
const authenticateToken = require('../middlewares/jwt_auth.middleware');
const check_role = require('../middlewares/check_role.middleware');

//PUBLIC

//PRIVATE
//GET /api/user/me
router.get("/me",authenticateToken,UserController.getMe);
//PUT /api/user/me
router.put("/me",authenticateToken,UserController.updateMe);
//DELETE /api/user/me
router.delete("/me",authenticateToken,UserController.deleteMe);

//PRIVATE ADMIN
//GET /api/user/search?field={field}
router.get("/search",authenticateToken,check_role.isAdmin,UserController.GetUserByField);
//PUT /api/user/
router.put("/:id",authenticateToken,check_role.isAdmin,UserController.updateUser);
//DELETE /api/user/
router.delete("/",authenticateToken,check_role.isAdmin,UserController.deleteUser);

module.exports = router;
