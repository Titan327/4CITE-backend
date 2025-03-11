const User = require('../models/user.model');
const bcrypt = require("bcrypt");
require('dotenv').config();


async function createUser(req, res){
    try {

        // regex 1 minuscule / 1 majuscule / 1 chiffre / 1 charactere spécial
        const regexPswd = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

        const data = req.body;

        if (data.name.length > 50){
            return res.status(449).json({ error: "Name must be less than 50 character." });
        }
        if (data.surname.length > 20){
            return res.status(449).json({ error: "Surname must be less than 20 character." });
        }
        if (data.pseudo.length > 20){
            return res.status(449).json({ error: "Pseudo must be less than 20 character." });
        }
        if (data.email.length > 100){
            return res.status(449).json({ error: "Email must be less than 100 character." });
        }

        if (data.password.length < 8){
            return res.status(449).json({ error: 'Password must be more than 8 character.' });
        }
        if (!regexPswd.test(data.password)){
            return res.status(449).json({ error: 'The password must contain at least one lowercase letter, one uppercase letter, one digit, and one special character.' });
        }

        const existing = await User.findOne({
            where: {
                email: data.email,
            },
        });

        if (!existing){

            const pswdHash = await bcrypt.hash(data.password, 10); // une complexité de 10 est suffisante.

            await User.create({
                email: data.email,
                pseudo: data.pseudo,
                password: pswdHash,
                name: data.name,
                surname: data.surname,
                role: "user",
                active: 1,
            });

            return res.status(201).json({ success: "User created." });

        }else {

            return res.status(449).json({ error: "Email already used." });

        }
    } catch (error) {

        return res.status(500).json({ error: "An error has occurred" });

    }
}


module.exports = {
    createUser,
};
