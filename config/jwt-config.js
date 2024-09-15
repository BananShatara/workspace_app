const jwt = require('jsonwebtoken');
const secret = require('crypto');

const JWT_SECRET_KEY = secret.randomBytes.toString('hex');
const JWT_EXP_TIME = '1h';

module.exports = {JWT_SECRET_KEY, JWT_EXP_TIME};