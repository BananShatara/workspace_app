const { JWT_SECRET_KEY } = require('../config/jwt-config');
const jwt = require('jsonwebtoken');
const { db } = require('../config/db-config');

// Middleware to authenticate token and verify admin status

const authToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.sendStatus(401).json({'message': 'Token is missing.'});

    jwt.verify(token, JWT_SECRET_KEY, (err, user) => {
        if (err) return res.sendStatus(403).json({'message': 'Invalid token.'});

        console.log("Decoded User: ", user); // Log decoded user information

        req.user = user; // Save user in request object for later use
        next(); // Proceed to the next middleware or route handler
    });
};



module.exports = {authToken};