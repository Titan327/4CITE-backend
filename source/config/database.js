require("dotenv").config();
const { Sequelize } = require("sequelize");

// Configuration Sequelize
const sequelize = new Sequelize(
    process.env.DB_NAME || "Akkor",
    process.env.DB_USER || "root",
    process.env.DB_PASSWORD || "root",
    {
        host: process.env.DB_HOST || "db",
        dialect: process.env.DB_DIALECT || "mysql",
        logging: false
    }
);

// Vérifier la connexion à la base de données
const connectDB = async () => {
    try {
        await sequelize.authenticate();
        console.log("✅ Connexion à la base de données réussie");
    } catch (error) {
        console.error("❌ Erreur de connexion :", error);
        process.exit(1);
    }
};

module.exports = { sequelize, connectDB };
