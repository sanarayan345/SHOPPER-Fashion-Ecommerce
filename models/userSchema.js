const mongoose =require("mongoose");
const {Schema} =mongoose;


const userSchema = new Schema({
    name:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true,
        unique:true
    },
    phone:{
        type:String,
        required:false,
        unique:true,
        sparse:true,
        default:null
    },

     googleId:{
        type:String,
        unique:true,
        sparse:true
     },


    password:{
        type:String,
        required:false
    },
    isblocked:{
        type:Boolean,
        default:false
    },
    isAdmin:{
        type:Boolean,
        default:false
    },
     cart:[{
         type:Schema.Types.ObjectId,
         ref:"Cart"
     }],
    wallet:{
        type:Schema.Types.ObjectId
        // default:0
    },
    wishlist:[{
        type:Schema.Types.ObjectId,
        ref:"Wishlist"
    }],
    orderHistory:[{
        type:Schema.Types.ObjectId,
        ref:"Order"
    }],
    createdOn:{
        type:Date,
        default:Date.now
    },
    referalCode:{
        type:String
        // required:true
    },
    redeemed:{
        type:Boolean
        // default:false
    },
    redeemedUsers:[{
        type:Schema.Types.ObjectId,
        ref:"User"
        // required:true
    }],
    searchHistory:[
        {
        category:{
            type:Schema.Types.ObjectId,
            ref:"Category"
    },
    brand:{
        type:String,

    },
    searchedOn:{
        type:Date,
        default:Date.now
    }
}],

addresses: [{
    type: Schema.Types.ObjectId,
    ref: 'Address',
  }],
});


const User =mongoose.model("User",userSchema);
module.exports = User;
