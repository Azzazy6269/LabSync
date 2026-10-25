const util = require('util')
const prisma = require('../../config/prisma');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const APIError = require('../../utils/APIError');
const jwtSign = util.promisify(jwt.sign);

const signUp = async (userData)=>{
    const {email, fullName, phone, nationalId, jobTitle, role, password} = userData;

    const existingUser = await prisma.user.findFirst({
        where: {
            email: email
        }
    });
    if(existingUser){
        throw new APIError("user is already exist",400);
    }

    const passwordHash = await bcrypt.hash(password,12);
    const createdUser = await prisma.user.create({
        data:{email, fullName, phone, nationalId, jobTitle, role, passwordHash}
    });

    return createdUser;
}

const signIn = async (data)=>{
    const {email, password} = data;
    const user = await prisma.user.findFirst({
        where:{
            email
        }
    })

    if(!user){
        throw new APIError("Invalid email or password",401);
    }

    const isPasswordMatched = await bcrypt.compare(password,user.passwordHash);
    if(!isPasswordMatched){
        throw new APIError("Invalid email or password",401);
    }  

    const payload = 
        {
         id:user.id,
         email,
         fullName:user.fullName, 
         phone:user.phone, 
         nationalId:user.nationalId, 
         role:user.role
        } 
    const token = await jwtSign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
    return { token, user: { ...user, passwordHash: undefined } };
}
module.exports = {
    signUp,
    signIn
}