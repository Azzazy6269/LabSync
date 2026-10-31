const util = require('util')
const prisma = require('../../config/prisma');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const APIError = require('../../utils/APIError');
const jwtSign = util.promisify(jwt.sign);
const jwtVerify = util.promisify(jwt.verify);

const MAX_OTP_ATTEMPTS = 5;

// Helper: Delete old OTPs for this purpose and generate a new one
const generateAndSaveOtp = async (userId, purpose, expiresInMinutes = 10) => {
    // Invalidate any existing OTPs for this specific user & purpose
    await prisma.otp.deleteMany({
        where: { userId, purpose }
    });

    const rawOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const codeHash = await bcrypt.hash(rawOtp, 10);
    const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);

    await prisma.otp.create({
        data: {
            userId,
            purpose,
            codeHash,
            expiresAt
        }
    });

    return rawOtp;
};

// Helper: Verify OTP with attempt-throttling and consumption
const verifyAndConsumeOtp = async (userId, purpose, rawOtp) => {
    const otpRecord = await prisma.otp.findFirst({
        where: { userId, purpose },
        orderBy: { createdAt: 'desc' }
    });

    if (!otpRecord) {
        throw new APIError("No active OTP found. Please request a new code.", 400);
    }

    if (new Date() > otpRecord.expiresAt) {
        await prisma.otp.delete({ where: { id: otpRecord.id } });
        throw new APIError("OTP has expired. Please request a new code.", 400);
    }

    if (otpRecord.attempts >= MAX_OTP_ATTEMPTS) {
        await prisma.otp.delete({ where: { id: otpRecord.id } });
        throw new APIError("Too many failed attempts. Please request a new OTP.", 429);
    }

    const isValid = await bcrypt.compare(rawOtp, otpRecord.codeHash);
    if (!isValid) {
        await prisma.otp.update({
            where: { id: otpRecord.id },
            data: { attempts: { increment: 1 } }
        });
        throw new APIError("Invalid OTP code", 400);
    }

    // OTP validated successfully -> consume (delete) it
    await prisma.otp.delete({ where: { id: otpRecord.id } });
    return true;
};

// Helper: Generate Access and Refresh Tokens
const generateTokens = async (payload) => {
    const accessToken = await jwtSign(payload, process.env.JWT_SECRET, { 
        expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m' 
    });
    
    const refreshToken = await jwtSign(
        { id: payload.id }, 
        process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET, 
        { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
    );

    return { accessToken, refreshToken };
};

const refreshToken = async (token) => {
    try {
        const secret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;
        const decoded = await jwtVerify(token, secret);

        const user = await prisma.user.findUnique({ where: { id: decoded.id } });
        if (!user) {
            throw new APIError("User not found", 401);
        }

        if (user.status === 'SUSPENDED') {
            throw new APIError("Your account has been suspended", 403);
        }

        const payload = {
            id: user.id,
            email: user.email,
            fullName: user.fullName,
            role: user.role,
            isEmailVerified: user.isEmailVerified,
            status: user.status
        };

        const tokens = await generateTokens(payload);

        return {
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken
        };
    } catch (error) {
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            throw new APIError("Invalid or expired refresh token", 401);
        }
        throw error;
    }
};

const signUp = async (userData) => {
    const { email, fullName, phone, nationalId, jobTitle, role, password, repeatPassword } = userData;

    if (password !== repeatPassword) {
        throw new APIError("Passwords do not match", 400);
    }

    const existingVerifiedEmail = await prisma.user.findUnique({ where: { email, isEmailVerified:true } });
    if (existingVerifiedEmail) {
        throw new APIError("User with the same email already exists", 400);
    }

    const existingVerifiedNationalId = await prisma.user.findUnique({ where: { nationalId, isEmailVerified:true } });
    if (existingVerifiedNationalId) {
        throw new APIError("User with the same national ID already exists", 400);
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const existingEmailOrNationalId = await prisma.user.findFirst({ where: {
        OR: [
            { email },
            { nationalId }
        ],
        }
     });
    let createdUser;
    if (existingEmailOrNationalId) {
        createdUser = await prisma.user.update({
            where: { id: existingEmailOrNationalId.id },
            data: {
                email,
                fullName,
                phone,
                nationalId,
                jobTitle,
                role,
                passwordHash,
                createdAt: new Date()
            }
        });
    }else{
        createdUser = await prisma.user.create({
            data: {
                email,
                fullName,
                phone,
                nationalId,
                jobTitle,
                role,
                passwordHash
            }
        });
    }

    const rawOtp = await generateAndSaveOtp(createdUser.id, 'EMAIL_VERIFICATION');
    const { passwordHash: _, ...userWithoutSensitiveData } = createdUser;
    
    return { user: userWithoutSensitiveData, rawOtp };
};

const verifyOtp = async ({ email, otp }) => {
    if (!email || !otp) {
        throw new APIError("Email and OTP are required", 400);
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
        throw new APIError("User not found", 404);
    }

    if (user.isEmailVerified) {
        throw new APIError("Email is already verified", 400);
    }

    await verifyAndConsumeOtp(user.id, 'EMAIL_VERIFICATION', otp);


    const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: {
            isEmailVerified: true
        },
        select: {
            id: true,
            email: true,
            fullName: true,
            isEmailVerified: true,
            status: true,
            role: true
        }
    });

    return updatedUser;
};

const resendOtp = async (email) => {
    if (!email) {
        throw new APIError("Email is required", 400);
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
        throw new APIError("User not found", 404);
    }

    if (user.isEmailVerified) {
        throw new APIError("Email is already verified", 400);
    }

    const rawOtp = await generateAndSaveOtp(user.id, 'EMAIL_VERIFICATION');

    return { email: user.email, rawOtp, fullName: user.fullName };
};

const signIn = async (data) => {
    const { email, password } = data;
    const user = await prisma.user.findUnique({ where: { email, isEmailVerified: true } });

    if (!user) {
        throw new APIError("Invalid email or password", 401);
    }

    const isPasswordMatched = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordMatched) {
        throw new APIError("Invalid email or password", 401);
    }

    const payload = {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        status: user.status
    };

    const tokens = await generateTokens(payload);
    const { passwordHash: _, ...userWithoutPassword } = user;

    return { 
        token: tokens.accessToken, 
        refreshToken: tokens.refreshToken, 
        user: userWithoutPassword 
    };
};

const changePassword = async (userId, { currentPassword, newPassword, repeatNewPassword }) => {
    if (newPassword !== repeatNewPassword) {
        throw new APIError("Passwords do not match", 400);
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.passwordHash) {
        throw new APIError("User not found or uses OAuth authentication", 404);
    }

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
        throw new APIError("Incorrect current password", 400);
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
        where: { id: userId },
        data: { passwordHash: newPasswordHash }
    });

    return { message: "Password updated successfully" };
};

const forgotPassword = async (email) => {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
        return { message: "If an account exists with this email, a password reset OTP has been sent." };
    }

    const rawOtp = await generateAndSaveOtp(user.id, 'PASSWORD_RESET');

    return { email: user.email, rawOtp, fullName: user.fullName };
};

const resetPassword = async ({ email, otp, newPassword, repeatNewPassword }) => {
    if (newPassword !== repeatNewPassword) {
        throw new APIError("Passwords do not match", 400);
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
        throw new APIError("Invalid request", 400);
    }

    await verifyAndConsumeOtp(user.id, 'PASSWORD_RESET', otp);

    const passwordHash = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash }
    });

    return { message: "Password reset successful. You can now log in with your new password." };
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

const getProfileData = async (userId) => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            email: true,
            fullName: true,
            phone: true,
            nationalId: true,
            jobTitle: true,
            role: true,
            status: true,
            isEmailVerified: true,
            createdAt: true,
            updatedAt: true
        }
    });

    if (!user) {
        throw new APIError("User not found", 404);
    }

    return user;
};


module.exports = {
    signUp,
    signIn,
    updateUserById,
    verifyOtp,
    resendOtp,
    changePassword,
    forgotPassword,
    resetPassword,
    refreshToken,
    getProfileData
};