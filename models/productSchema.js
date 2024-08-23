const mongoose = require("mongoose");
const {Schema} = mongoose;

const imageSchema = new mongoose.Schema({
    url: { type: String, required: true },
    public_id: { type: String, required: true }
});


const sizeSchema = new mongoose.Schema({
    size: { type: String, required: true },
    stock: { type: Number, required: true },
    price: { type: Number, required: true },
    images: [imageSchema]
  });
  

  const variantSchema = new mongoose.Schema({
    color: { type: String, required: true },
    sizes: [sizeSchema]
  });



const productSchema = new Schema({
    productName:{
        type :String,
        required:true
    },
    description:{
        type:String,
        required:true
    },
    brand:{
        type:String,
        required:true
    },
    category:{
        type:Schema.Types.ObjectId,
        ref:"Category",
        required:true
    },
    regularPrice:{
        type:Number,
        required:true
    },
    salesPrice:{
        type:Number,
        required:true
    },
    productOffer:{
        type:Number,
        default:0
    },
    stock:{
        type:Number,
        required:true,
        
    },
     color:{
        type:String,
         required:true
     },


    // variants: [variantSchema],
    // isBlocked: {
    //   type: Boolean,
    //   default: false
    // },


    ProductImage:{
      type:[imageSchema],
      required:true,
      validate: [arrayMinLength, 'At least 3 images are required']
    },
    isBlocked:{
        type:Boolean,
        default:false
    },
    status:{
        type:String,
        required:false
    },
    createdOn:{
        type:Date,
        default:Date.now
    },
    averageRating:{
        type:Number

    },
    popularity:{
        type:Number
    },
    featured:{
        type:Boolean
    }
});


function arrayMinLength(val) {
    return val.length >= 3;
  }
productSchema.index({name:'text',description:'text'});

const Product = mongoose.model("Product",productSchema);
module.exports = Product;