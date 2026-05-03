# full stack auth system

## step 1 - register account  without social  login  (kust for email and pasword credencials) 

  user register with (name,email.password,Agree trams & condication)
  Backend create a New User Record  in DB;
  Generate a email otp 
  Generate a token for based on user info (name,email);
  save email otp on  user account  schema 
  Then backend sent a email otp on user mail - push on background job  queue (bullmq,redis,nodemiller);
  Backend send Response on Client and redreict to /verify-email?token




## Step 2 - User email verifaction  

   user go to /verify-email?token page
   enter a otp from email 
   from client to in backend we will send a {
    token - take from url,
    otp
   }

   Backend - (/verify-email)

   extract a token and otp from request body ;
   then verify the otp with extracted email and account otp 
   if verification success then update database and return to the login page

## Step 3 - Login account

  enter email,password ,
  check in backend credencial in database,
  verify email - again using otp based
  generate a access token
  generate a refresh token
  generate a new session witth the logedin device info,
  save session on db,
  send a response on client,


## step 3 - client Want to Profile data or any prottected data;

   middleware : 
   check if cookie avaliable on user request,
   then decode token 
   check deleted users redis queue ,
   check banned users redis  list,
   then check user profile data have in cache or not 
   if not in cache then fetch from database and caeche with new expire time
   save data in response.locals.user
   allow to go next 

   role middleware : 
   check user role and permisson 
   if role not match redricet with 403 error 


## update user profile
 ## change password ,
 ## reset  password ,
 ## device logout based on session ,
 ## logout from specfic device or all device;
 ## manages sesson.





## social signup  Google
  after login success create a new user recoard in db 
  skip email verify,

## social login 
  
  after oauth success 
  check in backend credencial in database,

  generate a access token
  generate a refresh token
  generate a new session witth the logedin device info,
  save session on db,
  send a response on client,



## google account convert to email based with add password 
