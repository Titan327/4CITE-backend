function isAdmin(req, res, next) {

    const userData = req.user;

    console.log(userData);

    if (userData.role === "admin"){
        next();
    }else {
        return res.status(403).json({ message: 'Acces refusé' });
    }

}

function isUser(req, res, next) {

    const userData = req.user;

    if (userData.role === "user" || userData.role === "admin"){
        next();
    }else {
        return res.status(403).json({ message: 'Acces refusé' });
    }

}


module.exports = {
    isAdmin,
    isUser
};