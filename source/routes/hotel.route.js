const router = require('express').Router();
const hotelController = require('../controllers/hotel.controller');
const authenticateToken = require('../middlewares/jwt_auth.middleware');
const check_role = require('../middlewares/check_role.middleware');

//PUBLIC
//GET /api/hotel/search?field={field}
router.get("/search",hotelController.getHotelByField);

//PRIVATE
//POST /api/hotel
router.post("/",authenticateToken,check_role.isAdmin,hotelController.createHotel);
//PUT /api/hotel
router.put("/:id",authenticateToken,check_role.isAdmin,hotelController.updateHotel);
//DELETE /api/hotel
router.delete("/:id",authenticateToken,check_role.isAdmin,hotelController.deleteHotel);

module.exports = router;
