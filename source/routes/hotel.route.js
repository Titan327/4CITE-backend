const router = require('express').Router();
const hotelController = require('../controllers/hotel.controller');

//PUBLIC
//GET /api/hotel/search?field={field}
router.get("/search",hotelController.GetHotelByField);



module.exports = router;
