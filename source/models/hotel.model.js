const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");
const Room = require("./room.model");
const Picture = require("./picture.model");

const HotelModel = sequelize.define('Hotels', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    address: {
        type: DataTypes.STRING,
        allowNull: false
    },
    city: {
        type: DataTypes.STRING,
        allowNull: false
    },
    country: {
        type: DataTypes.STRING,
        allowNull: false
    },
    description: {
        type: DataTypes.STRING,
        allowNull: false
    },
    active: {
        type: DataTypes.BOOLEAN,
        allowNull: false
    },
}, {
    timestamps: true,
    tableName: 'hotels'
});

HotelModel.associate = () => {
    HotelModel.hasMany(Room, { foreignKey: "hotel_id", as: "rooms" });
    HotelModel.hasMany(Picture, { foreignKey: "hotel_id", as: "pictures" });
};

module.exports = HotelModel;
