const router = require('express').Router();
const bookingController = require('../controllers/booking.controller');
const authenticateToken = require('../middlewares/jwt_auth.middleware');
const check_role = require('../middlewares/check_role.middleware');

//PUBLIC
//GET /api/booking/search?field={field}
router.get("/search",authenticateToken,check_role.isUser,bookingController.getBookingByField);

//PRIVATE
//POST /api/booking
router.post("/",authenticateToken,check_role.isUser,bookingController.createBooking);
//PUT /api/booking
router.put("/",authenticateToken,check_role.isUser,bookingController.updateBooking);
//DELETE /api/booking
router.delete("/",authenticateToken,check_role.isUser,bookingController.deleteBooking);

module.exports = router;
