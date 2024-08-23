const mongoose = require("mongoose")
const {Schema} = mongoose;
 const{v4:uuidv4}=require('uuid');   


const orderSchema = new Schema({
    orderId:{
        type:String,
        default:()=>uuidv4(),
        unique:true        
    },
    Items:[{
    product:{
        type:Schema.Types.ObjectId,
        ref:"Product",
        required:true
    },
    quantity:{
        type:Number,
        required:true
    },
    price:{
        type:Number,
        default:0
    }
}],
totalprice:{
    type:Number,
    required:true,
    min:0
},
discount:{
    type:Number,
    default:0
},
finalAmount:{
    type:Number,
    required:false
},
addressId:{
    type:Schema.Types.ObjectId,
    ref:"Address",
    required:true
},
paymentMethod:{
    type:String,
    required:true
},
userId:{
    type:Schema.Types.ObjectId,
    ref:"User",
    required:true
},
invoiceDate:{
    type:Date,

},
status:{
    type:String,
    default:'pending'
},
cancellationReason: {
    type: String,
    default: 'none'
  },

createdOn:{
    type:Date,
    default:Date.now,
    required:false
},
couponApplied:{
    type:Boolean,
    default:false
}

});
const Order = mongoose.model("Order",orderSchema);

module.exports = Order;