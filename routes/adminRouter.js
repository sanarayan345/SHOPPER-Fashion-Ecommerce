const express = require("express");
 
const router = express.Router();
const admincontroller =require("../controllers/admin/admincontroller");
 const {ensureAuthenticated,forwardAuthenticated,ensureAdmin}=require("../middleware/auth")




router.get("/login",admincontroller.loadLogin);

router.post("/login",admincontroller.Login);
router.get("/dashboard",admincontroller.loadDashboard);
router.get("/customers",admincontroller.loadCustomer);
router.post("/customers/:id/toggle-block",admincontroller.toggleUserBlock);
router.get("/categories",admincontroller.loadCategory);
router.post("/categories/add",admincontroller.addCategory);
router.post("/categories/:id/update",admincontroller.updateCategory);
router.post("/categories/:id/delete",admincontroller.deleteCategory);
router.get("/addproducts",admincontroller.loadProducts);
router.post("/addproducts/add",admincontroller.upload,admincontroller.loadAddProduct);
router.get("/products",admincontroller.loadProductslist);
router.get("/products/edit/:id", admincontroller.loadEditProductForm);
router.post("/products/edit/:id",admincontroller.upload, admincontroller.loadUpdateProduct );
router.post("/products/delete/:id", admincontroller.loadDeleteProduct);

router.delete("/products/:productId/images/:publicId",ensureAuthenticated,admincontroller.loadDeleteImage);

router.get('/orders', ensureAuthenticated, admincontroller.loadOrderManagement);
router.get('/orders/:id', ensureAuthenticated, admincontroller.loadOrderDetails);

router.post('/cancel-order/:orderId',ensureAuthenticated, admincontroller.cancelOrder);
router.post('/orders/:id/status', ensureAuthenticated,admincontroller.updateOrderStatus);



router.get("/logout",admincontroller.loadLogout);

module.exports = router;