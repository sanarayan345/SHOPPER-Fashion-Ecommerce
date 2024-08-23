 const User = require("../../models/userSchema");
 const mongoose =  require("mongoose");
 const Category = require("../../models/categorySchema");
const multer = require("multer");
const sharp =require("sharp");
const Product = require("../../models/productSchema");
const path =require("path");
const fs=require("fs").promises;
const cloudinary = require("../../config/cloudinary");
const Order =require('../../models/orderSchema');
const Address=require('../../models/addressSchema');


const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
}).array("ProductImage",5);




 const bcrypt = require("bcrypt");




//  Admin login
   const loadLogin = (req,res)=>{
     if(req.session.admin){
         return res.redirect("/admin/dashboard");
     }
     res.render("admin-login",{message:null})
   }



const Login = (req, res) => {
  const { email, password } = req.body;

  if (email === "admin@shopper.com" && password === "admin123") {
      req.session.admin = true;
      res.redirect("/admin/dashboard");
  } else {
      res.render("admin-login", { message: "Invalid credentials" });
  }
};

// ViewDashboard

const loadDashboard =(req,res)=>{
  if(req.session.admin){
   res.render("dashboard");
  }else{
    res.redirect("/admin/login")
}
}
// User management

// List Users
const loadCustomer = async (req, res) => {
  try {
      const customers = await User.find({isAdmin:false});
      res.render("customers",{customers});
  } catch (error) {
    console.error("Error fetching customers:",error);
      res.status(500).send("server error");
  }
};

// Block User

const toggleUserBlock = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.isblocked = !user.isblocked;
    await user.save();

    const action = user.isblocked ? 'blocked' : 'unblocked';
    console.log(`User is ${action}`);
    res.json({ 
      success: true, 
      message: `User ${action} successfully`, 
      user: { id: user._id, isblocked: user.isblocked }
    });
  } catch (error) {
    console.error("Error", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// category management


// load Category page
const loadCategory = async (req, res) => {
  try{
   const categories = await Category.find({isDeleted:false});
  res.render("categories",{categories});
}
catch (error) {
  console.error('Error:', error);
  res.status(500).send("Error fetching categories");
}
 
};


// Add a new category
const addCategory = async (req, res) => {
  try {
    console.log("Full request body:",req.body);

    const { name, description } = req.body;

    // Validate the incoming data
    if (!name || !description) {
      return res.status(400).json({error:'All fields are required'});
    }


    const newCategory = new Category({
      name:req.body.name,
      description:req.body.description,
      // categoryOffer:req.body.offer
      
  });
  await newCategory.save();

  res.status(201).json({ 
    success:true,
    message: 'Category added successfully', 
    category:newCategory
  });
} catch (error) {
  res.status(500).json({success:false,message:'Error adding category',details:error.message});
}
};


//  Update a category
const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).send('Category not found');
    }
    // update the category details
    category.name = name;
    category.description = description;
    // category.categoryOffer=offer;
    // save the updated category
    await category.save();

    res.json({
      success:true,
       message: 'Category updated successfully',
       category
     });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send(error.message);
  }
};

//  Soft delete a category
const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).send('Category not found');
    }
    category.isDeleted = true;
     await category.save();
     res.redirect('/admin/categories');
   } catch (error) {
     console.error('Error:', error);
     res.status(500).send(error.message);
   }
 };

      

// Render Add Product Form
const loadProducts= async (req, res) => {
  const categories = await Category.find();
  res.render('addproducts', { categories });
};

// Add product details
const loadAddProduct = async (req, res) => {
  
      const { productName, description, brand, category, regularPrice, salesPrice, productOffer, stock, color, isBlocked, status } = req.body;
  
        const processImages = async(files)=>{
      if (files.length < 3) {
          throw new Error('Minimum 3 images required');
      }
    
      const imageData = await Promise.all(files.map(async (file) => {
        try{
        
          const buffer = await sharp(file.buffer).resize({width: 500,height: 500,fit:'cover'}).toBuffer();


          const result = await new Promise((resolve, reject) => {
            cloudinary.uploader.upload_stream(
              { folder: 'products' },
              (error, result) => {
                if (error) reject(error);
                else resolve(result);
              }
            ).end(buffer);
          });
    
          return {
            url: result.secure_url,
            public_id: result.public_id
          };

        } catch (error) {
          console.error('Error processing image:', error);
          throw new Error('Failed to process image');
        }


        }));

      
      return imageData;
  }
    try{

      if (!productName || !description || !brand || !category || !regularPrice) {
        throw new Error('Missing required product information');
      }



      const files = req.files; // Ensure req.files is an array of image files

      if (!files || !Array.isArray(files)||files.length<3) {
        throw new Error('Minimum 3 image files required');
      }
      const processedImageData = await processImages(files);
      // Proceed with processedImages

      const product = new Product({
          productName,
          description,
          brand,
          category,
          regularPrice,
          salesPrice,
          productOffer,
          stock,
          color,
          ProductImage:processedImageData,
          isBlocked: isBlocked ? true : false,
          status
      });

      await product.save();

      // After successfully adding the product
       res.json({ success: true, message: 'Product added successfully' });

      // res.redirect('/admin/products');
  } catch (error) {
    console.error('Error processing product:', error);
      res.status(500).send(error.message);
  }
};


const loadProductslist = async (req, res) => {
  try {
      const products = await Product.find({ isBlocked: false }).populate('category');
      res.render('products', { products });
  } catch (error) {
      res.status(500).send(error.message);
  }
};



const loadEditProductForm = async (req, res) => {
  try {

    const productId = req.params.id;
    
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).send('Invalid product ID');
    }



      const product = await Product.findById(productId).populate('category');

      if (!product) {
        return res.status(404).send('Product not found');
      }

      const categories = await Category.find({}, 'name _id'); // Fetch all categories
       console.log(product);

      res.render('editProduct', {
         product:product,
         categories:categories});
  } catch (error) {
      console.error('Error fetching product:', error);
      res.status(500).send('Internal Server Error');
  }
};


//  Handle updating a product
const loadUpdateProduct = async (req, res) => {
  console.log("Update product route hit:", req.params.id);

    const { productName, description, brand, category, regularPrice, salesPrice, productOffer, stock, color, isBlocked, status } = req.body;

    try {
            
      // Validate input
    if (!productName || !description || !brand || !category) {
      return res.status(400).send('Missing required fields');
    }


      let updatedFields = {
        productName,
        description,
        brand,
        regularPrice,
        salesPrice,
        productOffer,
        stock,
        color,
        isBlocked: isBlocked ? true : false,
        status,
        category
    };
      

    console.log("Submitted category ID:", category);

    const allCategories = await Category.find({}, 'name');
    console.log("All available categories:", allCategories.map(c => c.name));
    


    const categoryDoc = await Category.findById(category);
    if (!categoryDoc) {
      console.log(`No category found with name: ${category}`);


      return res.status(400).send('Invalid category');
    }
    updatedFields.category = categoryDoc._id;



    // If new files are uploaded, process and update the images
    if (req.files && req.files.length > 0) {
        const processImages = async (files) => {
            if (files.length < 3) {
                throw new Error('Minimum 3 images required');
            }

            const imageData = await Promise.all(files.map(async (file) => {
                const buffer = await sharp(file.buffer).resize({ width: 500, height: 500, fit: 'cover' }).toBuffer();

                const result = await new Promise((resolve, reject) => {
                    cloudinary.uploader.upload_stream(
                        { folder: 'products' },
                        (error, result) => {
                            if (error) reject(error);
                            else resolve(result);
                        }
                    ).end(buffer);
                });

                return {
                    url: result.secure_url,
                    public_id: result.public_id
                };
            }));

            return imageData;
        }

        const processedImageData = await processImages(req.files);

        const product = await Product.findById(req.params.id);
        if (product && product.ProductImage) {
            for (const img of product.ProductImage) {
                await cloudinary.uploader.destroy(img.public_id);
            }
        }



        updatedFields.ProductImage = processedImageData;
    }
    

      const updatedProduct = await Product.findOneAndUpdate(
        { _id: req.params.id },  // Use an object with _id for the filter
        updatedFields,
        { new: true, runValidators: true }
      );
  
      if (!updatedProduct) {
        return res.status(404).json({ success: false, message: 'Product not found' });
      }
      res.json({ success: true, message: 'Product updated successfully' });
  
      // res.redirect('/admin/products');
    } catch (error) {
      console.error('Error updating product:', error);
      res.status(500).send('Internal Server Error');
    }
  };

// Handle deleting a product
const loadDeleteProduct = async (req, res) => {
  try {
      await Product.findByIdAndDelete(req.params.id);
      res.redirect('/admin/products');
  } catch (error) {
      console.error('Error deleting product:', error);
      res.status(500).send('Internal Server Error');
  }
};


// Delete single product image
const loadDeleteImage = async (req, res) => {

  console.log(`Received request to delete image with id: ${req.params.id} and publicId: ${req.params.publicId}`);
    try {
      const {productId, publicId } = req.params;

        // Remove the image from Cloudinary
        await cloudinary.uploader.destroy(publicId);

        // Remove the image record from the product
        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).send('Product not found');
        }

        product.ProductImage = product.ProductImage.filter(image => image.public_id !== publicId);
        await product.save();

        res.json({ success: true, message: 'Image deleted successfully' });
    } catch (error) {
        console.error('Error deleting image:', error);
        res.status(500).send('Internal Server Error');
    }
};

// Admin Logout
const loadLogout= async (req, res) => {
    req.logout((err) => {
        if (err) {
            console.error(err);
            
            return res.redirect('/admin/dashboard?logout=error');
          }
          return res.redirect('/admin/login?logout=success');
      });
  };


  const loadOrderManagement = async (req, res) => {
    try {
      const orders = await Order.find().populate('userId').sort({ createdOn: -1 });
      res.render('orders', { orders });
    } catch (err) {
      console.error(err);
      res.status(500).send('Server Error');
    }
  };


  const loadOrderDetails = async (req, res) => {
    try {
      const order = await Order.findById(req.params.id)
        // .populate('userId')
        // .populate('Items.product');
  

        .populate({
          path: 'Items.product',
          model: 'Product'
        })
         .populate('addressId')
        .populate('userId');
  

      if (!order) {
        res.status(500).send('Server Error');
        return res.redirect('/admin/orders');
      }
  
      res.render('adminorder', {
        order: order
      });
    } catch (error) {
      console.error(error);
      res.status(500).send('Server Error');
      res.redirect('/admin/orders');
    }
  };


  const cancelOrder = async (req, res) => {
  
         const  orderId  = req.params.orderId;
         console.log('Attempting to cancel order:', orderId);
         try {
        // Find the order
        const order = await Order.findById(orderId);
        console.log('Order found:', order);


        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }


        if (!order.Items || order.Items.length === 0) {
          console.log('Order items array is empty');

          order.status = 'Cancelled';
          await order.save();
          
          return res.status(400).json({ message: 'Cannot cancel order with no items' });
      }


        if (order.status === 'Cancelled') {
          return res.status(400).json({ message: 'Order is already cancelled' });
      }


        // Update the order status to 'Cancelled'
        order.status = 'Cancelled';
        await order.save();

        // Restock products
        for (let item of order.Items) {
            await Product.findByIdAndUpdate(item.product, { $inc: { quantity: item.quantity } });
        }

        // Respond to the admin
        res.json({ message: 'Order cancelled successfully',order:order });

        // Optionally, you can notify the user about the cancellation
        // Implement user notification logic here if needed

    } catch (error) {
        console.error('Error cancelling order:', error);
        res.status(500).json({ message: 'Internal server error',error:error.message });
    }
};
  
const updateOrderStatus = async (req, res) => {
 
  try {
    const orderId = req.params.id;
    const newStatus = req.body.status;

    // Find the order by ID
    const order = await Order.findById(orderId).populate('Items.product');

    if (!order) {
        return res.status(404).send('Order not found');
    }

    // If the order status is being changed to "Cancelled", update the stock
    if (newStatus === 'Cancelled' && order.status !== 'Cancelled') {
        await Promise.all(order.Items.map(async item => {
            const product = item.product;
            product.quantity += item.quantity; // Adjust the stock
            await product.save();
        }));
    }

    // Update the order status
    order.status = newStatus;
    await order.save();

    res.redirect(`/admin/orders/${orderId}`);
} catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).send('Internal Server Error');
}
};





  module.exports = {
    loadLogin,
    Login,
     loadDashboard,
     loadCustomer,
     toggleUserBlock,
     loadCategory,
     addCategory,
     updateCategory,
     deleteCategory,
     loadProducts,
     loadAddProduct,
     upload,
     loadProductslist,
     loadEditProductForm,
     loadUpdateProduct,
     loadDeleteProduct,
     loadLogout,
     loadDeleteImage,
     loadOrderManagement,
     loadOrderDetails,
     cancelOrder,
     updateOrderStatus,
  }