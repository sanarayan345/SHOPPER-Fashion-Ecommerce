const passport = require("passport");
const GoogleStrategy =require("passport-google-oauth20").Strategy;
const User =require("../models/userSchema");
const env = require("dotenv").config();




passport.use(new GoogleStrategy({
    clientID:process.env.GOOGLE_CLIENT_ID,
    clientSecret:process.env.GOOGLE_CLIENT_SECRET,
    callbackURL:"http://localhost:4000/auth/google/callback"
},

async (accessToken,refreshToken,profile,done)=>{
    try{
        let  user = await User.findOne({googleId:profile.id}) 
         if(user){
            return done(null,user);
         }else{
            user =new User({
                name:profile.displayName,
                email:profile.emails[0].value,
                googleId:profile.id
            });
            await user.save();
            return done(null,user);
         }
    }catch(error){
        return done(error,null)

    }
}
));

passport.serializeUser((user,done)=>{
    
    console.log('Serializing user:', user.id);
    done(null,user.id)
});


passport.deserializeUser(async (id,done)=>{
    try{
        const user = await User.findById(id);
        console.log('Deserializing user:', user ? user._id : 'User not found');
   if (user) {
        done(null,user);
    }  else {
        done(null, false);
      }
     } catch(error){
        console.log('Error in deserializing user:', error);
        done(error,null);
    }
});

module.exports = passport;