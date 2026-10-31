const prisma = require('../../config/prisma');
const APIError = require('../../utils/APIError');


const getAllUsers = async (query) => {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const count = await prisma.user.count();
    const NumOfPages = Math.ceil(count / limit);

    if (page <= NumOfPages || count === 0) {
        const users = await prisma.user.findMany({
            skip: (page - 1) * limit,
            take: limit,
            select: {
                id: true,
                email: true,
                fullName: true,
                phone: true,
                nationalId: true,
                jobTitle: true,
                role: true,
                createdAt: true,
                updatedAt: true
            }
        });
        return { users, count, NumOfPages, message: "Users fetched successfully" };
    } else {
        return { users: [], count, NumOfPages, message: "You have reached the last page, there are no more users to fetch" };
    }
};

const getUserById = async (id) => {
    const user = await prisma.user.findUnique({
        where: { id },
        select: {
            id: true,
            email: true,
            fullName: true,
            phone: true,
            nationalId: true,
            jobTitle: true,
            role: true,
            createdAt: true,
            updatedAt: true
        }
    });

    if (!user) {
        throw new APIError("User not found", 404);
    }

    return user;
};

const deleteUserById = async (id) => {
    try {
        await prisma.user.delete({
            where: { id }
        });
        return { message: "User deleted successfully" };
    } catch (error) {
        if (error.code === 'P2025') {
            throw new APIError("User not found", 404);
        }
        throw error;
    }
};

const searchUsers = async (query) => {
    const { searchTerm, page: reqPage, limit: reqLimit } = query;

    if (!searchTerm || !searchTerm.trim()) {
        throw new APIError("Search term query parameter is required", 400);
    }

    const page = Number(reqPage) || 1;
    const limit = Number(reqLimit) || 10;
    const cleanSearch = searchTerm.trim();

    const searchCondition = {
        OR: [
            { fullName: { contains: cleanSearch, mode: 'insensitive' } },
            { email: { contains: cleanSearch, mode: 'insensitive' } }
        ]
    };

    const count = await prisma.user.count({ where: searchCondition });
    const NumOfPages = Math.ceil(count / limit);

    const users = await prisma.user.findMany({
        where: searchCondition,
        skip: (page - 1) * limit,
        take: limit,
        select: {
            id: true,
            email: true,
            fullName: true,
            phone: true,
            nationalId: true,
            jobTitle: true,
            role: true,
            createdAt: true,
            updatedAt: true
        }
    });

    return { users, count, NumOfPages, message: "Users search completed" };
};

const updateUserById = async (id, updateData) => {
    delete updateData.password;
    delete updateData.passwordHash;
    delete updateData.email;

    try {
        const updatedUser = await prisma.user.update({
            where: { id },
            data: updateData,
            select: {
                id: true,
                email: true,
                fullName: true,
                phone: true,
                nationalId: true,
                jobTitle: true,
                role: true,
                status: true,
                approvedById: true,
                isEmailVerified: true,
                createdAt: true,
                updatedAt: true
            }
        });

        return updatedUser;
    } catch (error) {
        if (error.code === 'P2025') {
            throw new APIError("User not found", 404);
        }
        throw error;
    }
};


module.exports = {
    getAllUsers,
    getUserById,
    updateUserById,
    deleteUserById,
    searchUsers
};