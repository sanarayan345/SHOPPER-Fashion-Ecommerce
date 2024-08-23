const User = require("../../models/userSchema") ;
const Product= require("../../models/productSchema");
const Category = require("../../models/categorySchema");
const Address = require("../../models/addressSchema");
const Order =require("../../models/orderSchema");
const Cart = require("../../models/cartSchema") ;

const nodemailer = require("nodemailer")
const bcrypt = require("bcrypt")
const env = require("dotenv").config();
const mongoose =require("mongoose");


const loadHomepage =async (req,res)=>{ 
    try{
        console.log("Session data on homepage load:", req.session);

         const user = req.session.user;
         console.log("user session data:",user);

         if(user){
            //  const userId =  (user._id);
            // const userData = await User.findById(userId);
            // console.log("Fetched user data:",userData);
            res.render("home",{user:user})
         }else{
            console.log('No user in session'); 
            return res.render("home",{user:null});
         }

        
    }catch (error){
        console.error("Error Loading HomePage",error);
        res.status(500).send("server error")
    }
}



 const loadSignup = async (req,res)=>{
    try{
        return res.render("signup");
    }catch(error){
        console.log("Home page not loading",error);
        res.status(500).send("Server Error");
    }
 }

       

    function generateOtp(){
        return Math.floor(100000 +Math.random()*900000).toString();
    }

     async function sendVerificationEmail(email,otp){
        try{
            const transporter =nodemailer.createTransport({
                service:"gmail",
                port:587,
                secure:false,
                requireTLS:true,
                auth:{
                    user:process.env.NODEMAILER_EMAIL,
                    pass:process.env.NODEMAILER_PASSWORD
                }
            })

               const info = await transporter.sendMail({
                  from:process.env.NODEMAILER_EMAIL,
                  to:email,
                  subject:"Verify Your account",
                  text:`Your OTP is ${otp}`,
                  html:`<b>Your OTP:${otp}</b>`
               })

                 return info.accepted.length>0



        }catch(error){
            console.error("Error sending email",error);
              return false;
        }
     }

           
 const signup = async(req,res)=>{
    try{
    const {name,phone,email,password,cpassword}=req.body;

             if(password!==cpassword){
                return res.render("signup",{message:"passwords do not match"})
             }
             const findUser = await User.findOne({email});
             if(findUser){
                return res.render("signup",{message:"User with this email already exists"})
             }

                const otp = generateOtp();
                const emailSent = await sendVerificationEmail(email,otp)

                   if(!emailSent){
                    return res.json("email-error")
                   }
            
             req.session.userOtp = otp;
             req.session.userData = {name,phone,email,password};
             res.render("verify-otp",{message:null});
             console.log("OTP Sent",otp);
            
    }catch(error){
        console.error("Signup error",error);
          res.redirect("/PageNotFound")       

    }
 }

const securepassword = async (password)=>{
    
        const passwordHash = await bcrypt.hash(password,10) 

        return passwordHash;
    }

 const verifyOtp = async (req,res)=>{
    try{
        const{otp} = req.body;
        console.log(otp);
      if(otp===req.session.userOtp)  {
        const user =req.session.userData
        const passwordHash = await securepassword(user.password);
        const saveUserData = new User({
            name:user.name,
            email:user.email,
            phone:user.phone,
            password:passwordHash

        });
        await  saveUserData.save();
        req.session.user = saveUserData._id;
        res.json({success:true,redirectUrl:"/"})
      }else{
        res.status(400).json({success:false,message:"Invalid OTP,please try again"})
      }

    }catch(error){
        console.error("Error Verifying OTP",error);
         res.status(500).json({success:false,message:"An error occured "})
    }
 }


 const resendOtp =async (req,res)=>{
    try{
        const {email}=req.session.userData;
        if(!email){
            return res.status(400).json({success:false,message:"Email not found in session"})
        }

         // Check if enough time has passed since the last OTP was sent
    const lastOtpSentTime = req.session.lastOtpSentTime || 0;
    const currentTime = Date.now();
    if (currentTime - lastOtpSentTime < 60000) { // 60000 ms = 1 minute
      return res.status(429).json({ success: false, message: "Please wait before requesting a new OTP" });
    }

          
        const  otp = generateOtp();
        req.session.userOtp = otp;
        req.session.lastOtpSentTime = currentTime;
        // console.log("Generated OTP",otp);


          const emailSent= await sendVerificationEmail(email,otp);
          if(emailSent){
            console.log("Resend OTP:",otp);
            res.status(200).json({success:true,message:"OTP Resend Successfully"})
          }else{
            console.log("Failed to sent OTP email");
            res.status(500).json({success:false,message:"Failed to resend OTP.please try again"})
          }

    }catch(error){
        console.error("Error resending OTP ",error);
        res.status(500).json({success:false,message:"Internal Server Error.please try again"})

    }
 }


   const loadLogin = async (req,res)=>{
    try{
        if(!req.session.user){
            return res.render("login")
        }else{
            res.redirect("/")
        }

    }catch(error){
        res.redirect("/PageNotFound")

    }
   }


   const login = async(req,res)=>{
    try{
        const {email,password}=req.body;

        const findUser = await User.findOne({isAdmin:0,email:email});
         if(!findUser){
            console.log("User Not Found");
            return res.render("login",{message:"User Not Found"})
         }
         if(findUser.isblocked){
            return res.render("login",{message:"user is blocked by admin"})

         }
            const passwordMatch = await bcrypt.compare(password,findUser.password);
            if(!passwordMatch){
                return res.render("login",{message:"Incorrect password"})
               }


            //   Create a session for the user
               req.session.user ={
                   id:findUser._id,
                   name: findUser.name,
                   email:findUser.email
               } ;

              

             console.log("Session after setting user:", req.session);

            //      //    Use Passport's login function
            //    req.login(findUser, (err) => {
            //     if (err) {
            //      console.error("Login error", err);
            //     return res.render("login", { message: "Login failed. Please try again later" });
            //    }
          
                


            //  Set session expiry
            req.session.cookie.maxAge = 24 * 60 * 60 * 1000; // 24 hours      
                   
            
                    // Set session expiry
                    req.session.cookie.maxAge = 24 * 60 * 60 * 1000; // 24 hours
            
                    // // Handle "Remember Me" functionality
                    // if (req.body.remember) {
                    //     req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
                    // }
            
                    // Save the session before redirecting
                    req.session.save((err) => {
                        if (err) {
                            console.error("Session save error", err);
                            return res.render("login", { message: "Login failed. Please try again later" });
                        }
                        
                        // // Regenerate session for security
                        //  req.session.regenerate((err) => {
                        //     if (err) {
                        //         console.error("Session regeneration error", err);
                        //         return res.render("login", { message: "Login failed. Please try again later" });
                        //     }
                            
                            // Redirect to home page or dashboard
                            res.redirect("/");
                        });
                    
                    
                    
            } catch (error) {
                    console.error("Login error", error);
                    res.render("login", { message: "Login failed. Please try again later" });
                }
            };

            // user Logout
   const loadLogout = async (req, res) => {
    
    req.session.destroy((err) => {
        if (err) {
            console.log("Logout error", err.message);

        //     return res.json({ success: false, message: "Error logging out" });

         }
       
    //     res.json({ success: true, message: "Successfully logged out" });

           res.redirect('/login');

     });
};



// Checkstatus

const loadCheckstatus = async (req, res) => {
  if (req.session&&req.session.user) {
      try {
          const user = await User.findById(req.session.user.id);
          if (user && user.isblocked) {
              req.session.destroy(err => {
                  if (err) {
                      return res.status(500).send('Error logging out');
                  }
                  return res.status(403).send('User is blocked');
              });
          } else {
              res.status(200).send('User is active');
          }
      } catch (error) {
          res.status(500).send('Error checking status');
      }
  } else {
      res.status(403).send('User not logged in');
  }
};




//  const loadShopping = async (req,res)=>{
//     try{
//         const products = await Product.find({ isBlocked: false }).populate('category');

//           // Check if products were fetched
//         if (!products||products.length===0) {
//             console.log('No products found');
//             return res.render("shop",{products:[]});
//         }

//         res.render('shop', {title:'shop', products });

//     } catch (error) {
//         console.error("Error fetching products:",error);
        
//         res.status(500).send('An error occurred while fetching products');
//     }
// };


const loadShopping = async (req, res) => {
  try {
      const { page = 1, limit = 10, search = '', sort = '', category = '' } = req.query;
      const skip = (page - 1) * limit;

      const query = {
          isBlocked: false,
          ...search && { name: new RegExp(search, 'i') },
         
      };
      if (category && mongoose.Types.ObjectId.isValid(category)) {
        query.category = category;
    }

      const sortOption = sort ? { [sort]: 1 } : {};

      const products = await Product.find(query)
          .populate('category')
          .sort(sortOption)
          .skip(skip)
          .limit(limit);

      const total = await Product.countDocuments(query);
      const categories = await Category.find({});

    

      res.render('shop', {
          title: 'shop',
          products,
          currentPage:parseInt (page),
          totalPages: Math.ceil(total / limit),
          search,
          sort,
          category,
          categories,
          limit: parseInt(limit), 
      });

  } catch (error) {
      console.error('Error fetching products:', error);
      res.status(500).send('An error occurred while fetching products');
  }
};

// searching products

const loadsearchProducts = async (req, res)=> {
  const { query, sort } = req.query;
  
  let sortOption = {};
  
  switch(sort) {
    case 'price_asc':
      sortOption = { price: 1 };
      break;
    case 'price_desc':
      sortOption = { price: -1 };
      break;
    case 'rating':
      sortOption = { averageRating: -1 };
      break;
    case 'popularity':
      sortOption = { popularity: -1 };
      break;
    case 'new':
      sortOption = { createdAt: -1 };
      break;
    case 'name_asc':
      sortOption = { name: 1 };
      break;
    case 'name_desc':
      sortOption = { name: -1 };
      break;
    default:
      sortOption = { featured: -1 };
  }

  try {
    const products = await Product.find(
      { $text: { $search: query } },
      { score: { $meta: "textScore" } }
    )
    .sort(sortOption)
    .exec();

    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}


 const loadShoppingDetail = async (req,res)=>{
    try{

            // Extract product ID from route parameters
         const productId = req.params.id;
         const userId = req.user._id;

         // Fetch product details by ID
         const product = await Product.findById(productId).populate('category');

         const cart = await User.findById(userId).populate({
          path: 'cart',
          populate: {
              path: 'items.productId'
          }
      });
       
      const cartCount = cart && cart.cart.length > 0 
            ? cart.cart[0].items.reduce((total, item) => total + item.quantity, 0) 
            : 0;


         // Check if product exists
         if (!product) {
             console.error('Product not found:', req.params.id);
             return res.status(404).send('Product not found');
         }
        //  product.stock = Number(product.stock) || 0;
 
         // Render the EJS template with the product details
         res.render('shopdetail', { product:product,cartCount:cartCount });
     } catch (error) {
         console.error('Error loading product details:', error);
         res.status(500).send('An error occurred while fetching product details.');
     }
 };






// Show user profile
const loadUserprofile= async (req, res) => {
   
    try {
        console.log("Loading user profile");
        console.log("Session data in loadUserProfile:", req.session);
        console.log("User data in loadUserProfile:", req.user);
    
        // Check if user is in the session
        if (!req.user) {
        
          console.error("User is not authenticated or user ID is not available in session.");
          return res.status(401).redirect('/login');
        }
        // Use the user ID from the session
        const userId = req.user._id;
    
        // Attempt to find the user and populate the necessary fields
        const user = await User.findById(userId)
          .populate('addresses')
          .populate('orderHistory');
           
          console.log("User data:", user); 

        if (!user) {
          console.error(`User with ID ${userId} not found.`);
          return res.status(404).send("User not found.");
        }
    
        // Render the profile page with the user data
        res.render("profile", { user:user });
      } catch (err) {
        console.error("Error loading user profile:", err);
        res.status(500).send('Server error');
      }
    };


    // Edit profile
    
      const loadEditProfile = async (req, res) => {
        try {
          const user = await User.findById(req.user._id);
          if (!user) {
            return res.status(404).send("User not found.");
          }
          res.render("editProfile", { user });
        } catch (error) {
          console.error('Error loading edit profile page:', error);
          res.status(500).send('An error occurred while loading the edit profile page');
        }
      };
      
      const loadUpdateProfile = async (req, res) => {
        try {
          const { name, email } = req.body;
          await User.findByIdAndUpdate(req.user._id, { name, email });
          res.redirect('/profile');
        } catch (error) {
          console.error('Error updating profile:', error);
          res.status(500).send('An error occurred while updating the profile');
        }
      };
      
      const loadChangePassword = async (req, res) => {
        try {
          const { currentPassword, newPassword, confirmPassword } = req.body;
          const user = await User.findById(req.user._id);
      
          if (!user) {
            return res.status(404).send("User not found.");
          }
      
          const isMatch = await bcrypt.compare(currentPassword, user.password);
          if (!isMatch) {
            return res.status(400).send("Current password is incorrect.");
          }
      
          if (newPassword !== confirmPassword) {
            return res.status(400).send("New passwords do not match.");
          }
      
          user.password = await bcrypt.hash(newPassword, 10);
          await user.save();
      
          res.redirect('/profile');
        } catch (error) {
          console.error('Error changing password:', error);
          res.status(500).send('An error occurred while changing the password');
        }
      }

      // Get Address

      const loadGetaddress = async (req, res) => {
        try {
            const user = await User.findById(req.user._id).populate('addresses');
            res.render('address', { user });
        } catch (error) {
            res.status(500).send('Server Error');
        }
    };
      
        // Add Address
      
           const loadAddaddress = async (req, res) => {

            try {
              const userId = req.user._id; // Retrieve user ID from session
          
               if (!userId) {
                 return res.status(401).send({ error: 'User not logged in' });
               }
             const {firstName, addressLine1, addressLine2, city, state, country,phone,altphone } = req.body;
             console.log('Received Data:', req.body);
            
                 const newaddress = new Address({
                     user:userId,
                     firstName,
                     addressLine1,
                     addressLine2,
                     city,
                     state,
                     country,
                     phone,
                     altphone,
                 });

                      await newaddress.save();
                   req.user.addresses.push(newaddress._id);
                   await req.user.save();
                   res.status(200).json({ message: 'Address added successfully' });
              } catch (error) {

              console.error('Error Adding Address:', error);
                  res.status(500).json({ message: 'Failed to add address' });
              }
            }

        

        //  Edit Address

      const loadEditaddress = async (req, res) => {
       
        const { id,firstName, addressLine1, addressLine2, city, state, country,phone,altphone } = req.body;
        try {
            await Address.findByIdAndUpdate(id, {firstName, addressLine1, addressLine2, city, state, country,phone,altphone });
            
            res.status(200).json({ message: 'Address updated successfully' });
        } catch (error) {
            res.status(500).json({ message: 'Failed to update address' });
        }
    };



    //   Delete Address

    const loadDeleteaddress = async (req, res) => {

      try {
    const { id } = req.body;
    await Address.findByIdAndDelete(id);
    res.status(200).json({ message: 'Address deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to delete address' });
  }
};




  
      // Cart Management

   

    // cart management ,Add to cart


//       const loadCart = async (req, res) => {
//         try {
//     const { productId, quantity } = req.body;
//     await addToCart(req.user._id, productId, parseInt(quantity));
//     res.redirect('/cart');
//   } catch (error) {
//     console.error('Error adding to cart:', error);
//     res.status(500).json({ error: 'Error adding to cart' });
//   }
// };
    
// stock update

    const loadStockupdate = async (req, res) => {
      const { productId,stock,quantity } = req.body;
      const userId = req.user._id; // Assuming you have user authentication in place
      
      console.log('Received request:', { productId,stock,quantity, userId });

     
      try {
        // Find the product in the database
        const product = await Product.findById(productId);
        console.log('Product found:', product);
         
        if (!product) {
          console.log('Product not found');
          return res.status(404).json({ success: false, message: 'Product not found' });
        }

        if (product.stock === undefined) {
          console.warn('Product stock is undefined. Setting to 0.');
          product.stock = 0;
        }
        
        console.log('Current stock:', product.stock);
        console.log('Requested quantity:', quantity);

        if (product.stock <quantity) {
          console.log('Not enough stock');
          return res.json({ success: false, message: 'Not enough stock' });
        }
        
       
        // Add to cart logic
        const price = product.salesPrice;
        const totalprice = price *quantity;

        let user = await User.findById(userId).populate('cart');
        let cart;
        
        // let cart = await Cart.findOne({ userId });
        
        // if (cart) {

          if (user.cart.length > 0) {
            cart = user.cart[0];
          const itemIndex = cart.items.findIndex(item => item.productId.toString() === productId);
          if (itemIndex > -1) {

          //   if (cart.items[itemIndex].quantity +quantity > product.stock) {
          //     console.log('Requested quantity exceeds stock');
          //     return res.json({ success: false, message: 'Requested quantity exceeds stock' });
          // }


            cart.items[itemIndex].quantity +=parseInt(quantity);
            cart.items[itemIndex].totalprice = cart.items[itemIndex].quantity * price;
          } else {

             if (quantity > product.stock) {
               console.log('Requested quantity exceeds stock');
               return res.json({ success: false, message: 'Requested quantity exceeds stock' });
           }

          
          
            cart.items.push({ productId, quantity:parseInt(quantity), price, totalprice });
          }
        } else {

      
          cart = new Cart({
            userId,
            items: [{ productId, quantity:parseInt(quantity), price, totalprice }]
          });
          user.cart.push(cart._id);
        }


          product.stock = Math.max(0, product.stock - quantity);
         await product.save();
         await cart.save();
         await user.save(); 

         const cartCount = cart.items.reduce((total, item) => total + item.quantity, 0);


        console.log('Cart saved successfully:', cart);
        res.json({ success: true, newStock: product.stock,cartCount, message: 'Added to cart successfully' });
          
      } catch (error) {
        console.error('Error adding to cart:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
      }
    };


    // listing items in cart

const loadListCartItems = async (req, res) => {
  const userId = req.user._id; // Assuming you have user authentication in place

  try {
      // const cart = await Cart.findOne({ userId }).populate('items.productId');

      const user = await User.findById(userId).populate({
        path: 'cart',
        populate: {
          path: 'items.productId'
        }
      });

      // if (!cart) {

        if (!user.cart || user.cart.length === 0) {
          return res.render('cart', { items: [], subtotal: 0, shipping: 0, total: 0 });

      }

      const cartCount = user.cart.length > 0
      ? user.cart[0].items.reduce((total, item) => total + item.quantity, 0)
      : 0;

      const cart = user.cart[0];
      let subtotal = cart.items.reduce((sum, item) => {
        const price = parseFloat(item.price || 0);
        const quantity = parseInt(item.quantity || 0);
        return sum + price * quantity;
      }, 0);
    
      let shipping = 150; // Example shipping cost
      let total = subtotal + shipping;

      const maxQuantityPerPerson = 5; 

      const itemsWithStock = cart.items.map(item => ({
        ...item.toObject(),
        stock: item.productId.stock,
        maxQuantity: maxQuantityPerPerson
      }));

      console.log('Items to render:', itemsWithStock);
      
      res.render('cart', { items:itemsWithStock, subtotal, shipping, total,maxQuantityPerPerson,cartCount });
  } catch (error) {
      console.error(error);
      res.status(500).send('Server error');
  }
};


const loadUpdateQuantity = async (req, res) => {
  const { productId, change } = req.body;
  const userId = req.user._id;

  try {

    const user = await User.findById(userId).populate('cart');
    if (!user || !user.cart || user.cart.length === 0) {
      return res.status(404).json({ success: false, message: 'Cart not found' });
    }

      // const cart = await Cart.findOne({ userId });
      const cart = user.cart[0];
      const product = await Product.findById(productId);


     
      if (!product) {

        return res.status(404).json({ success: false, message: 'Product not found' });
      }
          const itemIndex = cart.items.findIndex(item => item.productId.toString() === productId);

          if (itemIndex > -1) {
              // Update quantity and total price
           const newQuantity = cart.items[itemIndex].quantity += change;
           const maxQuantityPerPerson = 5;

           if (newQuantity > product.stock) {
            return res.json({ success: false, message: 'Not enough stock available' });
        }

              if (newQuantity <= 0) {
                  // Remove item if quantity is 0 or less
                  cart.items.splice(itemIndex, 1);

                } else if (newQuantity > maxQuantityPerPerson) {
                  return res.json({ success: false, message: `You can only add up to ${maxQuantityPerPerson} units of this product` });
              }else{
                cart.items[itemIndex].quantity = newQuantity;
                  cart.items[itemIndex].totalprice = newQuantity * cart.items[itemIndex].price;
              }

              await cart.save();

              // Calculate subtotal and total
              const subtotal = cart.items.reduce((sum, item) => sum + item.totalprice, 0);
              const shipping = 150; // Or calculate dynamically if needed
              const total = subtotal + shipping;

              return res.json({ success: true, updatedItem: cart.items[itemIndex] || null, subtotal, shipping, total, cartItemCount: cart.items.length });
          }   else {
            return res.json({ success: false, message: 'Item not found in cart' });
          }
    
  } catch (error) {
      console.error('Error updating quantity:',error);
      res.status(500).json({ success: false,message: 'Server error', error: error.message });
    
  }
};

// Remove from cart

const loadRemoveFromCart = async (req, res) => {
  const { productId } = req.body;
  const userId = req.user._id; 

  try {
      const cart = await Cart.findOne({ userId });

      if (cart) {
          cart.items = cart.items.filter(item => item.productId != productId);
          await cart.save();
      }

      res.redirect('cart');
  } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error removing item from cart' });
  }
};

// Render checkout Page

const loadCheckout = async (req, res) => {

const userId = req.user._id; // Assuming you have user authentication in place

try {
    const cart = await Cart.findOne({ userId }).populate('items.productId');
    
     // Log the complete cart data


     // Fetch user addresses
     const user = await User.findById(userId).populate('addresses');



    if (!cart) {
        return res.render('checkout', { cart: { items: [],shippingCost:0 },addresses:user.addresses, subtotal: 0, shipping: 0, total: 0,cartCount:0 });
    }

  


    let subtotal = cart.items.reduce((sum, item) => {
        const price = parseFloat(item.price || 0);
        const quantity = parseInt(item.quantity || 0);
        return sum + price * quantity;
    }, 0);


    let cartCount = cart.items.reduce((count, item) => count + item.quantity, 0);
    let shippingCost = 150; // Example shipping cost
    let total = subtotal + shippingCost;

    res.render('checkout', { cart:{ ...cart._doc, shippingCost },addresses: user.addresses, subtotal, shipping:shippingCost, total,cartCount });
} catch (error) {
    console.error(error);
    res.status(500).send('Server error');
}
};

// User controller functions

  const getAddresses= async (req, res) => {
    try {
      const addresses = await Address.find({ user: req.user._id });
      res.status(200).json(addresses);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get addresses' });
    }
  }

  //  Get address details
  const getAddressesid= async (req, res) => {
      try {
          const address = await Address.findById(req.params.id);
          res.json(address);
      } catch (error) {
          res.status(500).json({ error: 'Failed to get address details' });
      }
  };

  
const loadSaveaddress = async (req, res) => {

 try {
   console.log('Request body:', req.body);

   const { _id, firstName,lastName,email,phone,addressLine1, addressLine2, city, state, country, zipCode } = req.body;

   if (!addressLine1 || !city || !state ) {
     return res.status(400).json({ error: 'Please fill in all the required fields' });
   }

    
   if (_id) {
    // Update existing address
    await Address.findOneAndUpdate(
      { _id, user: req.user._id },
      { firstName, lastName,email,phone, addressLine1, addressLine2, city, state, country, zipCode },
      { new: true }
    );
  } else {

   const newAddress = new Address({
     user: req.user._id,
     firstName,
     lastName,
     email,
     phone,
     addressLine1,
     addressLine2,
     city,
     state,
     country,
     zipCode
    
   });

   console.log('New address:', newAddress);
   await newAddress.save();
  }
   res.status(200).json({ message: 'Address saved successfully' });
 } catch (error) {
   console.error('Error saving address:', error);
   res.status(500).json({ error: 'Failed to save address' });
 }
 };




// Place order
const loadOrderplaced = async (req, res) => {
  console.log(req.body)
  
  try {
      const { addressId, paymentMethod } = req.body;

      // if (!addressId) {
      //   return res.status(400).json({ error: 'Address ID is required' });
      // }
      // if (!paymentMethod) {
      //   return res.status(400).json({ error: 'Payment method is required' });
      // }
      // if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
      //   return res.status(400).json({ error: 'Cart items are required and must be a non-empty array' });
      // }

      
      
      const address = await Address.findOne({ _id: addressId, user:req.user._id });
      console.log('Address found:', address);
      if (!address) {
          return res.status(400).json({ error: 'Invalid address selected' });
      }

       const cart = await Cart.findOne({ userId:req.user._id }).populate('items.productId');
       console.log('Cart found:', cart);
       if (!cart || cart.items.length === 0) {
         return res.status(400).json({ error: 'Your cart is empty' });
       }



const totalprice = cart.items.reduce((sum, item) => {
  const itemTotal = Number(item.price) * Number(item.quantity);
  // return sum + itemTotal;
  return sum + (isNaN(itemTotal) ? 0 : itemTotal);
}, 0)+ (cart.shippingCost || 0);

// Ensure totalPrice is valid before saving
if (isNaN(totalprice) || !isFinite(totalprice)) {
  throw new Error("Calculated totalPrice is invalid");
}


cart.items.forEach(item => {
  console.log('Cart item:', item);
});

 // Create new order instance
 const newOrder = new Order({

  userId: req.user._id,
  addressId,
  paymentMethod,
  Items: cart.items.map(item => ({
    product: item.productId._id,
    quantity: item.quantity,
    price: item.price
  })),
  totalprice:totalprice,
  // shippingCost: cart.shippingCost||0
     status: "pending",
});

console.log(newOrder.Items);
      await newOrder.save();


      const user = await User.findById(req.user._id);
if (!user.orders) {
    user.orders = [];
}
user.orderHistory.push(newOrder._id);
await user.save();
       
      // Clear the user's cart after placing the order
      await Cart.findOneAndUpdate({ userId:req.user._id }, { $set: { items: [] } });

      res.status(200).json({ message: 'Order placed successfully', orderId: newOrder._id });
  } catch (error) {
    console.error('Error placing order:', error);

    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
  }
      res.status(500).json({ error: 'Failed to place order' });
  }
};

// // Order confirmation page
// router.get('/order-confirmation', (req, res) => {
//   res.render('order-confirmation');
// });


// // Order confirmation page
// const loadOrder = async (req, res) => {
//   try {
//       const order = await Order.findOne({ _id: req.params.orderId, user: req.user._id }).populate('address');
//       if (!order) {
//           return res.status(404).render('error', { message: 'Order not found' });
//       }
//       res.render('order', { order });
//   } catch (error) {
//       console.error('Error loading order confirmation:', error);
//       res.status(500).render('error', { message: 'Error loading order confirmation' });
//   }
// };



const getOrderDetails = async (req, res) => {
  try {
      // Fetch all orders for the logged-in user
       const orders = await Order.find({ userId: req.user._id }).populate('Items.product');

       // Check if the orders array is correctly populated
       if (orders.length === 0) {
        console.log('No orders found for this user');
    } else {
        console.log(`Found ${orders.length} orders for the user`);
    }
      
      // Render the order details page with the list of orders
      res.render('orderDetails', { orders });
  } catch (error) {
      console.error('Error fetching order details:', error);
      res.status(500).render('error', { message: 'Error fetching order details' });
  }
};

const loadgetOrderDetail = async (req, res) => {
  try {
      const orderId = req.params.orderId;
      const order = await Order.findById(orderId)
          
      .populate({
        path: 'Items.product',
        model: 'Product'
      })
      .populate('addressId')
      .populate('userId');

      if (!order) {
          return res.status(404).render('error', { message: 'Order not found' });
      }

      res.render('orderDetailView', { order });
  } catch (error) {
      console.error('Error fetching order detail:', error);
      res.status(500).render('error', { message: 'Error fetching order detail' });
  }
};


const loadCancelOrder = async (req, res) => {
  try {
    const orderId = req.params.orderId;
    const order = await Order.findOne({ _id: orderId, userId: req.user._id });
    
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.status === 'cancelled') {
      return res.status(400).json({ success: false, message: 'Order is already cancelled' });
    }
    
    // Update order status to 'cancelled'
    order.status = 'cancelled';
    await order.save();

    for (const item of order.Items) {
      await Product.findByIdAndUpdate(item.product, { 
        $inc: { quantity: item.quantity}
      });
    }

    
    res.json({ success: true });
  } catch (error) {
    console.error('Error cancelling order:', error);
    res.status(500).json({ success: false, message: 'Failed to cancel order' });
  }
};



module.exports={
 loadHomepage,
 loadSignup,
 signup,
 loadShopping,
 verifyOtp,
 resendOtp,
 loadLogin,
 login,
 loadCheckstatus,
 loadLogout,
 loadsearchProducts,
 loadShoppingDetail,
 loadStockupdate,
 loadUserprofile,
 loadEditProfile,
 loadUpdateProfile,
 loadChangePassword,
 loadGetaddress,
 loadAddaddress,
 loadEditaddress,
 loadDeleteaddress,
//  loadCart,
 loadListCartItems,
 loadRemoveFromCart,
 loadUpdateQuantity,
 loadCheckout,
 getAddresses,
 getAddressesid,
 loadSaveaddress,
 loadOrderplaced,
 getOrderDetails,
 loadgetOrderDetail,
 loadCancelOrder,
};