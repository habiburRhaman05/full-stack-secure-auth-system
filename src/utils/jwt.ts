
/* eslint-disable @typescript-eslint/no-explicit-any */
import jwt, { JwtPayload, SignOptions } from "jsonwebtoken";
import { envConfig } from "../config/env";


export const createToken = (payload: JwtPayload, secret: string, { expiresIn }: SignOptions) => {
    const token = jwt.sign(payload, secret, { expiresIn });
    return token;
}

const verifyToken = (token: string, secret: string) => {
    try {
        const decoded = jwt.verify(token, secret) as JwtPayload;
        return {
            success: true,
            data: decoded
        }
    } catch (error: any) {
        return {
            success: false,
            message: error.message,
            error
        }
    }
}

const decodeToken = (token: string) => {
    const decoded = jwt.decode(token) as JwtPayload;
    return decoded;
}

const generateEmailToken = (payload:{email:string;name:string;}) =>{
        const token = jwt.sign(payload, envConfig.JWT_EMAIL_TOKEN_SECRET, { expiresIn:'5m' });
        return token
}




export const jwtUtils = {
    createToken,
    verifyToken,
    decodeToken,
    generateEmailToken
}