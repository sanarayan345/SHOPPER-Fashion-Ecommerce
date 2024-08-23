// middleware/auth.js
const User = require("../models/userSchema");
const mongoose =  require("mongoose");


 const ensureAuthenticated = async (req, res, next) => {
  
     console.log('Checking authentication status');
     console.log('Session data:', req.session);
     console.log('User data:', req.user);
     

    // if (req.session && (req.session.user||req.session.id)) {

    //    const userData = req.session.user || req.session;
    //    let user;
    //    try{
    //   user = await User.findById(userData.id);



    if (req.session && req.session.user) {
      const userId = req.session.user.id;
      let user;

      try {
          user = await User.findById(userId);

    } catch (err) {
      console.error('Error retrieving user data:', err);
      return res.redirect('/login');
  }

  if (!user) {
    console.log('User not found');
    return res.redirect('/login');
}



       // If session exists, set req.user if it's not already set
      if (!req.user) {
         req.user = user;
       }
  
      console.log('User is authenticated:', req.user);
  
       // Check if user is blocked
      //  User.findById(req.user._id)
      //    .then(user => {
      //      if (user && user.isblocked) {

      if (user.isblocked) {
             req.session.destroy(err => {
               if (err) console.error('Session destruction error:', err);

              // return res.status(403).send('User is blocked by admin');
                   res.redirect('/login')
             });
          } else {
             return next();
           }
        // }
        // .catch(err => {
        //    console.error('Error checking user blocked status:', err);
        //   return res.redirect('/login');
        //  });
     } else {
       console.log('User is not authenticated');
       res.redirect('/login');
     }
   }
 


// const ensureAuthenticated = async (req, res, next) => {
//   console.log('Checking authentication status');
//   console.log('Session data:', req.session);

//   try {
//     if (req.session && (req.session.user || req.session.id)) {
//       const userData = req.session.user || req.session;
      
//       console.log('User data from session:', userData);

//       const user = await User.findById(userData.id);
      
//       if (!user) {
//         console.log('User not found in database');
//         return res.status(401).json({ success: false, message: 'User not found' });
//       }

//       if (user.isblocked) {
//         console.log('User is blocked');
//         req.session.destroy(err => {
//           if (err) console.error('Session destruction error:', err);
//           return res.status(403).json({ 
//             success: false, 
//             message: 'User is blocked by admin',
//             action: 'FORCE_LOGOUT'
//           });
//         });
//       } else {
//         console.log('User is authenticated and not blocked');
//         req.user = user; // Use the fresh user data from DB
//         return next();
//       }
//     } else {
//       console.log('User is not authenticated');
//       return res.status(401).json({ success: false, message: 'User not authenticated' });
//     }
//   } catch (error) {
//     console.error('Error in ensureAuthenticated:', error);
//     return res.status(500).json({ success: false, message: 'Internal server error' });
//   }
// };


  
  const forwardAuthenticated = (req, res, next) => {
    if (!req.session||!req.session.user) {
      return next();
    }
    res.redirect('/admin/login');
  };
  
  const ensureAdmin = (req, res, next) => {
    if (req.session && req.session.user && req.session.user.role === 'admin') {
      if (!req.user) {
        req.user = req.session.user;
      }
      return next();
    }
    res.redirect('/admin/login');
  };
  
  module.exports = {
    ensureAuthenticated,
    forwardAuthenticated,
    ensureAdmin
  };
