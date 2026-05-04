import type { Request, Response } from "express";
import { sendSuccess } from "../../utils/apiResponse";
import { asyncHandler } from "../../utils/asyncHandler";
import { authServices } from "./auth.service";
import { CookieUtils } from "../../utils/cookie";
import { tokenUtils } from "../../utils/token";
import { envConfig } from "../../config/env";
import status from "http-status"
import { AppError } from "../../utils/AppError";
import { jwtUtils } from "../../utils/jwt";
import { emailQueue } from "../../queue/emailQueue";
import { emailTypes } from "../../utils/email.utils";
const isProduction = envConfig.NODE_ENV === "production";

// -------------------- REGISTER --------------------
const registerController = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, password ,contactNumber,role} = req.body;

  const user = await authServices.registerUser({
    name, email, password,contactNumber,role
  })


  

    // email token with user info 
  const emailToken =  jwtUtils.generateEmailToken({email:user.email,name:user.name});

  const emailPayload = {
    name:user.name,
    email:user.email,
    otp:user.otp,

  }
  // await emailQueue.add(emailTypes.sent_verify_email,emailPayload);
  console.log(emailPayload);
  


  return sendSuccess(res, {
    statusCode: 201,
    data: {...user,emailToken},
    message: " User Account Created Successfully"
  })
});

// // -------------------- LOGIN --------------------
// const loginController = asyncHandler(async (req: Request, res: Response) => {
//   const { email, password } = req.body;
//   ;

//   const data = await authServices.loginUser({ email, password })

//   tokenUtils.setAccessTokenCookie(res, data.accessToken)
//   tokenUtils.setRefreshTokenCookie(res, data.refreshToken)
//   tokenUtils.setBetterAuthSessionCookie(res, data.sessionToken)

//   return sendSuccess(res, {
//     statusCode: 200,
//     data,
//     message: "your are LoggedIn Sucessfully"
//   })
// });
// // -------------------- PROFILE DATA --------------------
// const getUserProfileController = asyncHandler(async (req: Request, res: Response) => {
//   const user = await authServices.getCustomerProfile(res.locals.auth)
//   return sendSuccess(res, {
//     data: user,
//     message: "Profile Data fetch Successfully"
//   })
// });
// // -------------------- LOGOUT --------------------
// const logoutUserController = asyncHandler(async (req: Request, res: Response) => {


//   const better_auth_session_token = req.cookies["better-auth.session_token"]
//   const refreshToken = req.cookies["refreshToken"]

//   const user = await authServices.logoutUser(better_auth_session_token,refreshToken)
//   CookieUtils.clearCookie(res, "accessToken", {
//     httpOnly: true,
//     secure: isProduction,
//     sameSite: isProduction ? "none" : "lax",
//     path: '/',
//     maxAge: 15 * 60 * 1000,
//   })
//   CookieUtils.clearCookie(res, "refreshToken", {
//     httpOnly: true,
//     secure: isProduction,
//     sameSite: isProduction ? "none" : "lax",
//     path: '/',
//     maxAge: 7 * 24 * 60 * 60 * 1000,
//   })
//   CookieUtils.clearCookie(res, "better-auth.session_token", {
//     httpOnly: true,
//     secure: isProduction,
//     sameSite: isProduction ? "none" : "lax",
//     path: '/',
//     maxAge: 24 * 60 * 60 * 1000,
//   })
//   return sendSuccess(res, {
//     statusCode: 200,
//     data: user,
//     message: "User Logout Successfully"
//   })
// });
// // -------------------- CHANGE PASSWORD --------------------
// const changePasswordController = asyncHandler(async (req: Request, res: Response) => {

// console.log(req.body);


//   const better_auth_session_token = req.cookies["better-auth.session_token"];

//   const { currentPassword, newPassword } = req.body

//   const user = await authServices.changePassword({
//     sessionToken: better_auth_session_token,
//     currentPassword,
//     newPassword
//   })

//   console.log("ssuccess");
  
//   return sendSuccess(res, {
//     statusCode: 200,
//     data: user,
//     message: "Password change Successfully"
//   })
// });
// // -------------------- REFRESH TOKEN --------------------
// const getRefreshTokenController = asyncHandler(async (req: Request, res: Response) => {



//   const refreshToken = req.cookies.refreshToken;
 
//   if (!refreshToken) {
//     throw new AppError("Refresh token is missing", status.UNAUTHORIZED);
//   }

//   // const  {cookie,token} = req.body;
//   const result = await authServices.getAllNewTokens(refreshToken)
//   // console.log(sessionToken);

//   tokenUtils.setAccessTokenCookie(res, result.accessToken)
//   tokenUtils.setRefreshTokenCookie(res, result.refreshToken)
//   tokenUtils.setBetterAuthSessionCookie(res, result.sessionToken)

//   return sendSuccess(res, {
//     statusCode: 201,
//     message: "refresh token generate Successfully",
//     data: result
//   })
// });
// // -------------------- REQUEST FOR RESET PASSWORD MAIL --------------------
// const requestPasswordResetController = asyncHandler(async (req: Request, res: Response) => {

//   const { email } = req.body;


//   const result = await authServices.requestResetPassword(email)

//   return sendSuccess(res, {
//     statusCode: 201,
//     message: "Reset Password Link successFully send; Check Index",
//   })
// });
// // --------------------  RESET PASSWORD MAIL --------------------
// const resetPasswordController = asyncHandler(async (req: Request, res: Response) => {

//   const { newPassword } = req.body;
//   const { token } = req.query

//   const result = await authServices.resetPassword(newPassword, token as string)
//   return sendSuccess(res, {
//     statusCode: 201,
//     message: "Your Reset Password  successFully",
//   })
// });

// // --------------------  VERIFY EMAIL --------------------
// const verifyEmail = asyncHandler(async (req, res) => {

//   const {email,otp} = req.body;
//   const result = await authServices.verifyEmail({email,otp})


//    return sendSuccess(res,{
//     message:"Your email verification is successfull",
//     statusCode:200
//    })
 
// })
// // -------------------- SEND OTP  --------------------
// const resendOtp = asyncHandler(async (req, res) => {

//   const {email,verificationType} = req.body;

//    await authServices.resendOtp(email,verificationType)

//    return sendSuccess(res,{
//  message: "OTP resent successfully" 
//    })
 
// })
// // --------------------  CHANGE AVATAR --------------------
// const changeProfileAvatar = asyncHandler(async (req, res) => {
//         const payload = {
//           profileAvatarUrl:req.body.profileAvatar,
//           userId:res.locals.auth.userId,
//         };
//         console.log(payload);
        
//         const updatedResult = await authServices.changeAvatar(payload.profileAvatarUrl,payload.userId)
//         console.log("chnage both");
        
//         return sendSuccess(res,{
//           data:updatedResult,
//           message:"Your Profile Avatar Change Successfully"
//         })
// })
// // --------------------  UPDATE PROFILE --------------------
// const updateProfileInfo = asyncHandler(async (req, res) => {
  
//          const userId =res.locals.auth.userId
        
//         const updatedResult = await authServices.updateProfile(req.body,userId)
//         return sendSuccess(res,{
//           data:updatedResult,
//           message:"Your Profile Updated Successfully"
//         })
// })



// // --------------------  LOGIN WITH GOOGLE --------------------

// const googleLogin = asyncHandler(async (req: Request, res: Response) => {
//   const redirectPath = req.query.redirect || "/dashboard";

//   const encodedRedirectPath = encodeURIComponent(redirectPath as string);

//   const callbackURL = `${envConfig.BETTER_AUTH_URL}/api/v1/auth/google/success?redirect=${encodedRedirectPath}`;
//   const nonce = "random-string-123";
//   res.render("googleRedirect", {
//     callbackURL: callbackURL,
//     betterAuthUrl: envConfig.BETTER_AUTH_URL,
//     scriptNonce: nonce
//   })
// })

// const googleLoginSuccess = asyncHandler(async (req: Request, res: Response) => {
//   const redirectPath = req.query.redirect as string || "/dashboard/patient";

//   const sessionToken = req.cookies["better-auth.session_token"];

//   if (!sessionToken) {
//     return res.redirect(`${envConfig.CLIENT_URL}/login?error=oauth_failed`);
//   }

//   const session = await auth.api.getSession({
//     headers: {
//       "Cookie": `better-auth.session_token=${sessionToken}`
//     }
//   })

//   if (!session) {
//     return res.redirect(`${envConfig.CLIENT_URL}/login?error=no_session_found`);
//   }


//   if (session && !session.user) {
//     return res.redirect(`${envConfig.CLIENT_URL}/login?error=no_user_found`);
//   }

//   const result = await authServices.googleLoginSuccess(session);

//   const { accessToken, refreshToken } = result;

//   tokenUtils.setAccessTokenCookie(res, accessToken);
//   tokenUtils.setRefreshTokenCookie(res, refreshToken);
//   // ?redirect=//profile -> /profile
//   const isValidRedirectPath = redirectPath.startsWith("/") && !redirectPath.startsWith("//");
//   // const finalRedirectPath = isValidRedirectPath ? redirectPath : "/dashboard";
// console.log(redirectPath);

//   res.redirect(`${envConfig.CLIENT_URL}${redirectPath}`);
// })

// const handleOAuthError = asyncHandler(async (req: Request, res: Response) => {
//   const error = req.query.error as string || "oauth_failed";
//   res.redirect(`${envConfig.CLIENT_URL}/login?error=${error}`);
// })



export const authControllers = {
  registerController, 
  // loginController, getUserProfileController, logoutUserController,
  // changePasswordController,
  // getRefreshTokenController,
  // requestPasswordResetController, resetPasswordController,
  // verifyEmail,
  // updateProfileInfo,changeProfileAvatar,
  // resendOtp,
  // googleLoginSuccess,
  // handleOAuthError,
  // googleLogin
};
