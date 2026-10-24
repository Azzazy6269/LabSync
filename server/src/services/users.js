const util = require('util')
const prisma = require('../../config/prisma');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const APIError = require('../../utils/APIError');
const jwtSign = util.promisify(jwt.sign);

const signUp = async (userData)=>{
    const {email, fullName, phone, nationalId, jobTitle, role, password} = userData;

    const existingUser = await prisma.user.findFirst({
        email
    });
    if(existingUser){
        throw new APIError("user is already exist",400);
    }

    const passwordHash = await bcrypt.hash(password,12);
    const createdUser = await prisma.user.create({
        email, fullName, phone, nationalId, jobTitle, role, passwordHash
    });

    return createdUser;
}


module.exports = {
    signUp
}