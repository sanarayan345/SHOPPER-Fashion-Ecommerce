const  mongoose =require("mongoose");

const dotenv =require("dotenv").config();




const db = async()=>{
    try{
     await mongoose.connect(process.env.MONGODB_URI);
    console.log("Mongodb connected");
} catch(error){
    console.error("DB connection Failed",error);
    process.exit(1);
}
}
module.exports = db;