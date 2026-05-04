
import { UserRole, UserStatus } from "../../generated/prisma/enums";
import { prisma } from "../../lib/prisma";
import { emailQueue } from "../../queue/emailQueue";
import { AppError } from "../../utils/AppError";
import { emailTypes, generateOTP } from "../../utils/email.utils";
import { jwtUtils } from "../../utils/jwt";
import bcrypt from "bcrypt"
import type {
  IRegisterPayload
} from "./auth.interface";
import { uuidv4 } from "zod";
import { sendSuccess } from "../../utils/apiResponse";



export const getProfileCacheKey = (userId: string, role: string) => `profile:${userId}-${role}`;


const registerUser = async (payload: IRegisterPayload) => {

    const emailOtp = generateOTP();
  const hasedPassword = await bcrypt.hash(payload.password,10)

  // check user already existing with the same info 
  const user = await prisma.user.findUnique({
    where: {
      email: payload.email
    }
  });

  if (user) {
    throw new AppError("The User Already With This Email. Try Another Email", 400)
  }
  // create a db record 





  const createNewUser = await prisma.$transaction(async(tx)=>{

        const user = await tx.user.create({
      data:{
  email:payload.email,
      name:payload.name,
      status:UserStatus.active,
      role:payload.role,
      account:{
        create:{
          
           authType:"local",
      passwordHash:hasedPassword!,
        }
      }
      }
    });

  

    

    return {...user}
  })



  return {...createNewUser,otp:emailOtp}

};








export const authServices = {
  registerUser,

};
