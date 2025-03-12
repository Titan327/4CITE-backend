require('dotenv').config();
const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
YAML = require('yamljs');
swaggerDoc = YAML.load('./swagger.yaml');
const app = express();
const { sequelize, connectDB } = require("./config/database");

app.use(express.json());
app.use(express.urlencoded({extended:false}));
app.use(cors({
    origin:'*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
}))


app.use('/api/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDoc));

connectDB().then(() => {
    sequelize.sync({ alter: false })
    //sequelize.sync({ force: true })
        .then(() => console.log("✅ Base de données synchronisée"))
        .catch(err => console.error("❌ Erreur de synchronisation :", err));
});

const authRoutes = require("./routes/auth.route");
app.use("/api/auth", authRoutes);

const userRoutes = require("./routes/user.route");
app.use("/api/user", userRoutes);

const hotelRoutes = require("./routes/hotel.route");
app.use("/api/hotel", hotelRoutes);

const bookingRoutes = require("./routes/booking.route");
app.use("/api/booking", bookingRoutes);

const roomRoutes = require("./routes/room.route");
app.use("/api/room", roomRoutes);


const PORT = process.env.EXPRESS_PORT;
app.listen(PORT, () => console.log(`Server up and running on http://localhost:${PORT}`))
