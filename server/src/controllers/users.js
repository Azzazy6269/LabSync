const usersService = require("../services/users");

const getAllUsers = async (req, res, next) => {
    try {
        const response = await usersService.getAllUsers(req.query);
        res.status(200).json({ 
            message: response.message, 
            data: { 
                users: response.users, 
                count: response.count, 
                NumOfPages: response.NumOfPages 
            } 
        });
    } catch (error) {
        next(error);
    }
};

const getUserById = async (req, res, next) => {
    try {
        const user = await usersService.getUserById(req.params.id);
        res.status(200).json({ message: "User details retrieved successfully", data: { user } });
    } catch (error) {
        next(error);
    }
};

const deleteUserById = async (req, res, next) => {
    try {
        const response = await usersService.deleteUserById(req.params.id);
        res.status(200).json({ message: response.message });
    } catch (error) {
        next(error);
    }
};

const searchUsers = async (req, res, next) => {
    try {
        const response = await usersService.searchUsers(req.query);
        res.status(200).json({ 
            message: response.message, 
            data: { 
                users: response.users, 
                count: response.count, 
                NumOfPages: response.NumOfPages 
            } 
        });
    } catch (error) {
        next(error);
    }
};

const updateUserStatus = async (req, res, next) => {
    try {
        const { status } = req.body;

        const updatePayload = {
            status,
            ...(status === 'APPROVED' && { approvedById: req.user.id })
        };

        const user = await usersService.updateUserById(req.params.id, updatePayload);

        res.status(200).json({
            message: `User status successfully changed to ${status}`,
            data: { user }
        });
    } catch (error) {
        next(error);
    }
};

const updateUserById = async (req, res, next) => {
    try {
        const user = await usersService.updateUserById(req.params.id, req.body);
        res.status(200).json({ 
            message: "User updated successfully", 
            data: { user } 
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getAllUsers,
    getUserById,
    deleteUserById,
    searchUsers,
    updateUserById,
    updateUserStatus
};