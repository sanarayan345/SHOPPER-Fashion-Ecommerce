const mongoose = require("mongoose");
 const{Schema}= mongoose;
  

 const addressSchema = new Schema({
    user:{
        type :Schema.Types.ObjectId,
        ref:"User",
        required:true
    },
    firstName:{
        type:String,
        required:false
    },
    lastName:{
        type:String,
        required:false
    },
    email:{
        type:String,
        required:false
    },
        addressLine1:{
            type:String,
            required:true
        },
        addressLine2:{
            type:String,
            required:true
        },
        city:{
            type:String,
            required:true
        },
        // landMark:{
        //     type:String,
        //     required:false
        // },
        state:{
            type:String,
            required:true
        },
         zipcode:{
             type:String,
             required:false
         },
        country:{
            type:String,
            required:false
        },
        phone:{
            type:String,
            required:false
        },
        altphone:{
            type:String,
            required:false
        }
    
 });
  const Address = mongoose.model("Address",addressSchema);

  module.exports = Address;