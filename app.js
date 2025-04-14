// Core Module
const path = require('path');

// External Module
const express= require('express');

const session=require('express-session');
const mongodbStore=require('connect-mongodb-session')(session);
//Local Module
const storeRouter = require("./routes/storeRouter")
const hostRouter = require("./routes/hostRouter")
const rootDir = require("./utils/pathUtil");
const errorsController = require("./controllers/errors");
const mongoose= require('mongoose');
const authRouter = require('./routes/authRouter');
const DB_PATH = "mongodb+srv://madhurichavan15122003:madhuri123@cluster0.ebzbryk.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

const app=express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

const store= new mongodbStore({ //to store session data in MongoDB
  uri: DB_PATH,
  collection:'sessions'// 
})
app.use(express.urlencoded());//
// app.use("/host", hostRouter);
//now internally session is destroy
app.use(session(
  {
  secret:"my secret", //saves the session id in the cookie, which is used to identify the session on the server
  resave:false, // resave is used to save the session even if it is not modified
  saveUninitialized:true,//saveUninitialized is used to save the session even if it is not initialized
  store:store,//store is used to save the session in the database
  }
));
//we need to read a session:first way
app.use((req, res, next)=>{
  console.log("session value:", req.session);
  req.isLoggedIn=req.session.isLoggedIn; //to check if the user is logged in or not
  next();
});
//second way to replace req.cookie with req.session

// app.use((req, res, next)=>{
//   console.log("cookie check middleware", req.get('cookie'));
//   req.isLoggedIn=req.get('cookie')? req.get('cookie').split('=')[1] === 'true' : false;
//   console.log(req.isLoggedIn);
//   next();
// });
app.use(authRouter);
app.use(storeRouter);

app.use("/host", (req, res, next)=>{
if(req.isLoggedIn){
  next();
}
else{
  res.redirect("/login");
}
});
app.use("/host", hostRouter);

app.use(express.static(path.join(rootDir, 'public')))

app.use(errorsController.pageNotFound);

const PORT = 3000;
// const DB_PATH = "mongodb+srv://madhurichavan15122003:madhuri123@cluster0.ebzbryk.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

mongoose.connect(DB_PATH).then(() => {
  console.log('Connected to Mongo');
  app.listen(PORT, () => {
    console.log(`Server running on address http://localhost:${PORT}`);
  });
});