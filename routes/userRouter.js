const express = require("express");
const router =express.Router();
const passport = require("passport");
const usercontroller =require("../controllers/user/usercontroller")


const {ensureAuthenticated,forwardAuthenticated,ensureAdmin} = require("../middleware/auth.js");


// router.get("/pageNotFound",usercontroller.pageNotFound);
router.get("/",usercontroller.loadHomepage);
router.get("/signup",usercontroller.loadSignup);
router.post("/signup",usercontroller.signup);
router.get("/shop",usercontroller.loadShopping);
router.get("/shopdetail/:id",ensureAuthenticated,usercontroller.loadShoppingDetail)
router.post("/verify-otp",usercontroller.verifyOtp);
router.post("/resend-otp",usercontroller.resendOtp);
router.get('/shop/search', usercontroller.loadsearchProducts);

router.get("/auth/google",passport.authenticate('google',{scope:['profile','email']}));
router.get('/auth/google/callback',passport.authenticate('google',{failureRedirect:'/signup'}),(req,res)=>{
    res.redirect("/");
});
router.get("/login",forwardAuthenticated,usercontroller.loadLogin);
router.get("/check-status",ensureAuthenticated,usercontroller.loadCheckstatus);
router.post("/login",usercontroller.login);

router.get("/profile",ensureAuthenticated,usercontroller.loadUserprofile);
router.get('/profile/edit', ensureAuthenticated, usercontroller.loadEditProfile);
router.post('/update-profile',ensureAuthenticated,usercontroller. loadUpdateProfile);
router.post('/change-password',ensureAuthenticated,usercontroller.loadChangePassword);



router.get('/profile/address', ensureAuthenticated, usercontroller.loadGetaddress);

router.post("/profile/address/add",ensureAuthenticated, usercontroller.loadAddaddress);
router.post("/profile/address/edit", ensureAuthenticated, usercontroller.loadEditaddress);
router.post("/profile/address/delete", ensureAuthenticated, usercontroller.loadDeleteaddress);

router.post("/api/addToCart",ensureAuthenticated,usercontroller.loadStockupdate);

//    router.post('/cart/add-to-cart',ensureAuthenticated, usercontroller.loadCart);

router.get('/cart',ensureAuthenticated, usercontroller.loadListCartItems);
router.post('/remove-from-cart',ensureAuthenticated, usercontroller.loadRemoveFromCart);
router.post("/cart/update-quantity", ensureAuthenticated,usercontroller.loadUpdateQuantity);

router.get('/checkout',ensureAuthenticated,usercontroller.loadCheckout);
router.get('/checkout/get-addresses', ensureAuthenticated, usercontroller.getAddresses);
router.get("/checkout/get-address/:id",ensureAuthenticated,usercontroller.getAddressesid);
router.post('/checkout/save-address',ensureAuthenticated,usercontroller.loadSaveaddress);
router.post('/checkout/place-order',ensureAuthenticated,usercontroller.loadOrderplaced);
router.get('/profile/orders',ensureAuthenticated,usercontroller.getOrderDetails);
router.get('/profile/order/:orderId',ensureAuthenticated,usercontroller.loadgetOrderDetail);
router.post('/profile/order/:orderId/cancel', ensureAuthenticated, usercontroller.loadCancelOrder);


router.get("/logout",usercontroller.loadLogout);


module.exports =router;