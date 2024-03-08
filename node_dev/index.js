const express = require("express");
const { port } = require("./config/config");
var cors = require('cors')
require("dotenv").config();
const mongoose = require("./mongodb");
const App = express();
const path = require('path');



//port
//const PORT = process.env.PORT || 3000;
const PORT = port;

App.use(express.json({ limit: '50mb' }));
App.use(express.urlencoded({ limit: '50mb' }));
//Middlewares global

App.use(cors())
App.use(express.json());
App.use(express.urlencoded({ extended: true }));
App.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept,Authorization");
  next();
});

// const connection = connect;
 mongoose.connect()

 global.fy = ''

App.post("/fy", (req, res) => {
  global.fy = req.body.fy
  
  console.log(req.body.fy,"fy check")

  mongoose.connect(req.body.fy);
  res.status(200).send("MongoDb Connected");
});

if (process.env.NODE_ENV === "production") {
}
// view engine setup
// console.log()
App.set('views', path.join(__dirname, 'views'));
App.set('view engine', 'ejs');

App.get("/", (req, res) => {
  res.status(200).send("Incorrect Path");
});

//ROUTES
App.use("/files", require("./pages/files/index"));
App.use("/user", require("./pages/master/index"));
App.use("/master", require("./pages/master/index"));

//fy migrate
App.use("/fyMigrate", require("./pages/financialYearMigration/index")) 

App.use("/reports", require("./pages/reports/index"));

App.use("/profile", require("./global"));

App.use("/encrypt-decrypt", require("./pages/encrypt-decrypt/index"));

//  Listening Server
App.listen(PORT, () => {
  console.log(`Server Started at ${PORT}`);
});

