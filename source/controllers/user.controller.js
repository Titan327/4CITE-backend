const User = require('../models/user.model');
const bcrypt = require("bcrypt");
require('dotenv').config();

async function GetUserByField(req, res) {
    try {
        console.log("ici");
        const param = req.query;
        const keyObj = Object.keys(param)
        const searchField = ['id', 'email', 'pseudo', 'name', 'surname'];

        if (!keyObj.every((key) => searchField.includes(key))){
            return res.status(449).json({ error: "One of the fields cannot be used." });
        }

        if (keyObj.length !== 0){

            await User.findAll({
                attributes: [
                    'id',
                    'email',
                    'name',
                    'surname',
                    'pseudo',
                    'role',
                    'active',
                    'createdAt',
                ],
                where:param
            }).then((resultat) => {

                return res.status(200).json({ success: resultat });

            }).catch((err) => {
                return res.status(500).json({ error: "An error has occurred." });

            });

        }else {
            return res.status(500).json({error: "An error has occurred."});
        }
    } catch (error) {
        return res.status(500).json({ error: 'An error has occurred.' });
    }
}

async function getMe(req, res) {
    try {
        const token_user = req.user;

        await User.findOne({
                where: {
                    id : token_user.id
                },
                attributes: [
                    'id',
                    'email',
                    'name',
                    'surname',
                    'pseudo',
                    'role',
                    'active',
                    'createdAt',
                    'updatedAt',
                ]
            }
        ).then((result) => {
            return res.status(200).json({ success: result });
        }).catch(() => {
            return res.status(500).json({ error: "An error has occurred." });
        });
    } catch (error) {
        return res.status(500).json({ error: 'An error has occurred.' });
    }
}

async function updateMe(req, res) {
    try {
        const userId = req.user.id;
        const updatedField = req.body;
        const keyObj = Object.keys(updatedField)
        const modifField = [
            'email',
            'name',
            'surname',
            'pseudo',
            'password',
        ]; // champ possible a etre modifier

        if (!keyObj.every((key) => modifField.includes(key))){
            return res.status(449).json({ error: "One of the fields cannot be used." });
        }

        if (updatedField["password"]){
            updatedField["password"] = await bcrypt.hash(updatedField["password"], 10);
        }

        await User.update(
            updatedField,
            {where: {id : userId}}
        ).then(() => {
            return res.status(200).json({ success: "User edit." });
        }).catch(() => {
            return res.status(500).json({ error: "An error has occurred." });
        });
    } catch (error) {
        return res.status(500).json({ error: 'An error has occurred.' });
    }
}

async function deleteMe(req, res) {
    try {
        const userId = req.user.id;

        await User.destroy({
            where: {id: userId}}
        ).then(() => {
            return res.status(200).json({success: "User deleted."});
        }).catch(() => {
            return res.status(500).json({error: "An error has occurred."});
        });
    } catch (error) {
        return res.status(500).json({ error: "An error has occurred." });
    }
}

module.exports = {
    GetUserByField,
    getMe,
    updateMe,
    deleteMe,
};
