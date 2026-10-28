const usersService = require("../services/users");
const emailService = require("../services/email");

const signUp = async (req, res, next) => {
    try {
        const { user, rawOtp } = await usersService.signUp(req.body);
        
        await emailService.sendEmail(
            user.email,
            "Email Verification OTP",
            "emailVerification",
            { otp: rawOtp, fullName: user.fullName }
        );

        res.status(201).json({
            message: "User created successfully. Verification OTP sent to email.",
            data: { user }
        });
    } catch (error) {
        next(error);
    }
};

const verifyOtp = async (req, res, next) => {
    try {
        const user = await usersService.verifyOtp(req.body);
        res.status(200).json({
            message: "Email verified successfully",
            data: { user }
        });
    } catch (error) {
        next(error);
    }
};

const resendOtp = async (req, res, next) => {
    try {
        const { email, rawOtp, fullName } = await usersService.resendOtp(req.body.email);
        
        await emailService.sendEmail(
            email,
            "Resend Email Verification OTP",
            "emailVerification",
            { otp: rawOtp, fullName }
        );

        res.status(200).json({
            message: "A new OTP has been sent to your email"
        });
    } catch (error) {
        next(error);
    }
};

const signIn = async(req,res,next)=>{
    try {
        const user = await usersService.signIn(req.body);
        res.status(201).json({ message: "User Logged In successfully", data: {user} })
    } catch (error) {
        next(error);
    }
}

const changePassword = async (req, res, next) => {
    try {
        const response = await usersService.changePassword(req.user.id, req.body);
        res.status(200).json({ message: response.message });
    } catch (error) {
        next(error);
    }
};

const forgotPassword = async (req, res, next) => {
    try {
        const { email, rawOtp, fullName } = await usersService.forgotPassword(req.body.email);

        if (rawOtp) {
            await emailService.sendEmail(
                email,
                "Password Reset OTP",
                "passwordReset",
                { otp: rawOtp, fullName }
            );
        }

        res.status(200).json({
            message: "If an account exists with this email, a password reset OTP has been sent."
        });
    } catch (error) {
        next(error);
    }
};

const resetPassword = async (req, res, next) => {
    try {
        const response = await usersService.resetPassword(req.body);
        res.status(200).json({ message: response.message });
    } catch (error) {
        next(error);
    }
};

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

const updateUserById = async (req, res, next) => {
    try {
        const user = await usersService.updateUserById(req.params.id, req.body);
        res.status(200).json({ message: "User updated successfully", data: { user } });
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



module.exports = {
    signUp,
    verifyOtp,
    resendOtp,
    signIn,
    getAllUsers,
    getUserById,
    updateUserById,
    deleteUserById,
    searchUsers,
    changePassword,
    forgotPassword,
    resetPassword
};