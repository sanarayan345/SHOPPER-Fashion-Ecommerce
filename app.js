const express =require ("express");
const path=require("path");
const MongoStore = require('connect-mongo');

const mongoose = require("mongoose");
const db=require("./config/db");
const app=express();
const userRouter =require("./routes/userRouter");
const session=require("express-session")
const passport = require("./config/passport")
const adminRouter = require("./routes/adminRouter");
const bodyParser = require("body-parser");

   dotenv =require("dotenv").config();
db();

app.use(bodyParser.urlencoded({extended:false}));
app.use(bodyParser.json());

app.use(session({
    secret:process.env.SESSION_SECRET,
    resave:false,
    saveUninitialized:false,

    store: MongoStore.create({ 
        mongoUrl: mongoose.connection.client.s.url,
        collectionName: 'sessions' // optional, default: 'sessions'
      }),

    cookie:{
        secure: process.env.NODE_ENV === 'production',
        httpOnly:true,
        maxAge:72*60*60*1000
    }
}))


//  Middleware to log session data
// app.use((req, res, next) => {
//   console.log("Session data at start of request:", req.session);
//   next();
// });

app.use(passport.initialize());
app.use(passport.session());



app.use((req,res,next)=>{
    res.set("cache-control","no-store")
    next();
})




app.set("view engine","ejs");
app.set("views",[path.join(__dirname,"views/user"),path.join(__dirname,"views/admin")])
app.use(express.static(path.join(__dirname,"public")))


// Middleware to set breadcrumbs
app.use((req, res, next) => {
    res.locals.breadcrumbs = req.path.split('/').filter(crumb => crumb.length > 0);
    next();
});

// Use routes

app.use("/",userRouter);
app.use("/admin",adminRouter);

app.listen(4000,()=>{
    console.log("server is running at:http://localhost:4000")
})