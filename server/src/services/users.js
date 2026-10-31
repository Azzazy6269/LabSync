const prisma = require('../../config/prisma');
const APIError = require('../../utils/APIError');


const getAllUsers = async (query) => {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Number(query.limit) || 10);
    const { role, status, searchTerm } = query;

    const where = {};

    if (role) {
        where.role = role;
    }

    if (status) {
        where.status = status;
    }

    if (searchTerm && searchTerm.trim()) {
        const cleanSearch = searchTerm.trim();
        where.OR = [
            { fullName: { contains: cleanSearch, mode: 'insensitive' } },
            { email: { contains: cleanSearch, mode: 'insensitive' } }
        ];
    }

    const [count, users] = await Promise.all([
        prisma.user.count({ where }),
        prisma.user.findMany({
            where,
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
                status: true,
                createdAt: true,
                updatedAt: true
            },
            orderBy: { createdAt: 'desc' }
        })
    ]);

    const NumOfPages = Math.ceil(count / limit) || 1;

    return {
        users,
        count,
        NumOfPages,
        currentPage: page,
        message: "Users fetched successfully"
    };
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
    deleteUserById
};