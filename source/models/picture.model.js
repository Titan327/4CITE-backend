const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");
const Hotel = require("./hotel.model");

const PictureModel = sequelize.define('Pictures', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    hotel_Id: {
        type: DataTypes.INTEGER,
        references: {
            model: 'hotels',
            key: 'id'
        },
        allowNull: false
    },
    pictureId: {
        type: DataTypes.STRING,
        allowNull: false
    },
}, {
    timestamps: true,
    tableName: 'pictures'
});


PictureModel.associate = () => {
    PictureModel.belongsTo(Hotel, { foreignKey: 'hotel_Id', as: 'hotel' });
};

module.exports = PictureModel;
