const jwt = require('jsonwebtoken');
const util = require('util');
const prisma = require('../config/prisma');
const APIError = require('../utils/APIError');

const jwtVerify = util.promisify(jwt.verify);

const authenticate = async (req, res, next) => {
    try {
        let token;
        const authHeader = req.headers.authorization;

        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.split(' ')[1];
        }

        if (!token) {
            throw new APIError('You are not logged in. Please provide a token to gain access.', 401);
        }

        const decoded = await jwtVerify(token, process.env.JWT_SECRET);

        const currentUser = await prisma.user.findUnique({
            where: { id: decoded.id }
        });

        if (!currentUser) {
            throw new APIError('The user belonging to this token no longer exists.', 401);
        }

        if (currentUser.status === 'SUSPENDED') {
            throw new APIError('Your account has been suspended. Please contact an administrator.', 403);
        }

        req.user = currentUser;
        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return next(new APIError('Invalid token. Please log in again.', 401));
        }
        if (error.name === 'TokenExpiredError') {
            return next(new APIError('Your token has expired. Please log in again.', 401));
        }
        next(error);
    }
};


module.exports = {
    authenticate,
};