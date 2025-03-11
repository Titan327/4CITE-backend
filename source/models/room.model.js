const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");
const Hotel = require("./hotel.model");
const Picture = require("./picture.model");
const Booking = require("./booking.model");

const RoomModel = sequelize.define('Rooms', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    hotel_id: {
        type: DataTypes.INTEGER,
        references: {
            model: 'hotels',
            key: 'id'
        },
        allowNull: false
    },
    type_room: {
        type: DataTypes.STRING,
        allowNull: false
    },
    max_nb_people: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    number_of_room: {
        type: DataTypes.INTEGER,
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
    tableName: 'rooms'
});


RoomModel.associate = () => {
    RoomModel.belongsTo(Hotel, { foreignKey: 'hotel_id', as: 'hotel' });
    RoomModel.hasMany(Picture, { foreignKey: "room_id", as: "room" });
};

module.exports = RoomModel;
