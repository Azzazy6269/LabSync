const usersService = require("../services/users");


const signUp = async(req,res,next)=>{
    try {
        const user = await usersService.signUp(req.body);
        res.status(201).json({ message: "User created successfully", data: user })
    } catch (error) {
        next(error);
    }
}


module.exports = {
    signUp
}