const APIError = require('../../utils/APIError');

const restrictTo = (...roles) => {
    return (req, res, next) => {
        //console.log(req.user)
        if (!roles.includes(req.user.role)) {
            throw new APIError('You do not have permission to perform this action.', 403);
        }
        next();
    };
};

module.exports = {
    restrictTo
};