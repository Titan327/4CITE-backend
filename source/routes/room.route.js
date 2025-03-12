const router = require('express').Router();
const roomController = require('../controllers/room.controller');
const authenticateToken = require('../middlewares/jwt_auth.middleware');
const check_role = require('../middlewares/check_role.middleware');


//PUBLIC
//GET /api/room/search?field={field}
router.get("/search",roomController.getRoomByField);

//PRIVATE
//POST /api/room
router.post("/",authenticateToken,check_role.isAdmin,roomController.createRoom);
//PUT /api/room
router.put("/:id",authenticateToken,check_role.isAdmin,roomController.updateRoom);
//DELETE /api/room
router.delete("/:id",authenticateToken,check_role.isAdmin,roomController.deleteRoom);

module.exports = router;