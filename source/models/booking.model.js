const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");
const Room = require("./room.model");
const User = require("./user.model");

const BookingModel = sequelize.define('Booking', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    room_id: {
        type: DataTypes.INTEGER,
        references: {
            model: 'rooms',
            key: 'id'
        },
        allowNull: false
    },
    user_id: {
        type: DataTypes.INTEGER,
        references: {
            model: 'users',
            key: 'id'
        },
        allowNull: false
    },
    number_of_people: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    date_in: {
        type: DataTypes.DATE,
        allowNull: false
    },
    date_out: {
        type: DataTypes.DATE,
        allowNull: false
    },
    paid: {
        type: DataTypes.BOOLEAN,
        allowNull: false
    },
    active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
    },
}, {
    timestamps: true,
    tableName: 'bookings'
});


BookingModel.associate = () => {
    BookingModel.belongsTo(Room, { foreignKey: 'room_id', as: 'rooms' });
    BookingModel.belongsTo(User, { foreignKey: 'user_id', as: 'users' });
};

module.exports = BookingModel;
