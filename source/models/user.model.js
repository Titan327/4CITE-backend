const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");
const Booking = require("./booking.model");

const UserModel = sequelize.define('User', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false
    },
    pseudo: {
        type: DataTypes.STRING,
        allowNull: false
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    surname: {
        type: DataTypes.STRING,
        allowNull: false
    },
    role: {
        type: DataTypes.STRING,
        allowNull: false
    },
    active: {
        type: DataTypes.BOOLEAN,
        allowNull: false
    },
}, {
    timestamps: true,
    tableName: 'users'
});

UserModel.associate = () => {
    UserModel.hasMany(Booking, { foreignKey: "user_id", as: "users" });
};

module.exports = UserModel;