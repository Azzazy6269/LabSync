const authService = require("../services/auth");
const emailService = require("../services/email");

const signUp = async (req, res, next) => {
    try {
        const { user, rawOtp } = await authService.signUp(req.body);
        
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
        const user = await authService.verifyOtp(req.body);
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
        const { email, rawOtp, fullName } = await authService.resendOtp(req.body.email);
        
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
        const user = await authService.signIn(req.body);
        res.status(201).json({ message: "User Logged In successfully", data: {user} })
    } catch (error) {
        next(error);
    }
}

const refreshToken = async (req, res, next) => {
    try {
        const tokens = await authService.refreshToken(req.body.refreshToken);
        res.status(200).json({
            message: "Token refreshed successfully",
            data: tokens
        });
    } catch (error) {
        next(error);
    }
};

const changePassword = async (req, res, next) => {
    try {
        const response = await authService.changePassword(req.user.id, req.body);
        res.status(200).json({ message: response.message });
    } catch (error) {
        next(error);
    }
};

const forgotPassword = async (req, res, next) => {
    try {
        const { email, rawOtp, fullName } = await authService.forgotPassword(req.body.email);

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
        const response = await authService.resetPassword(req.body);
        res.status(200).json({ message: response.message });
    } catch (error) {
        next(error);
    }
};

const getProfileData = async (req, res, next) => {
    try {
        const user = await authService.getProfileData(req.user.id);
        res.status(200).json({
            message: "Profile retrieved successfully",
            data: { user }
        });
    } catch (error) {
        next(error);
    }
};

const editProfileData = async (req, res, next) => {
    try {
        const user = await authService.updateUserById(req.user.id, req.body);
        res.status(200).json({
            message: "Profile updated successfully",
            data: { user }
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
    editProfileData,
    changePassword,
    forgotPassword,
    resetPassword,
    refreshToken,
    getProfileData
};