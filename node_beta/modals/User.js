const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const saltRounds = 10;
const jwt = require("jsonwebtoken");
require("dotenv").config();
var ObjectId = require('mongodb').ObjectID;
const autoIncrement = require("mongoose-auto-increment");
autoIncrement.initialize(mongoose.connection);
const moment=require("moment");
const momentTime = require("moment-timezone")
const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, maxlength: 50, trim: true },
    email: { type: String, required: true, trim: true, unique: true },
    password: { type: String, required: true, minglength: 5 },
    role: { type: String,required:false, },
    showroom_warehouse_id: { type:Array,required:false,trim:true},
    role_id : { type: Number, required: true, trim: true,default: 0 },
    mobile: { type: String, required: false, minglength: 10,maxlength:10 },
    weekDays: { type: Array, required: false, trim: true, },

    active_status : { type: String, required: true, trim: true, default:'Y' },
    inserted_by_id : { type: Number, required: true, trim: true, default:0 },
    inserted_by_date : { type: String, required: true,  trim: true, default:Date.now},
    edited_by_id : { type: Number, required: true,  trim: true, default:0 },
    edit_by_date : { type: Number, required: true,  trim: true, default:Date.now},
    deleted_by_id : { type: Number, required: true, trim: true, default:0 },
    deleted_by_date : { type: Number, required: true, trim: true, default:Date.now},
    accessible_menus : { type: Array, required: true, trim: true },
    edit_log : { type : Array, required: false },
  },
);
userSchema.plugin(autoIncrement.plugin,{model:'User', field:'user_id', startAt:1, incrementBy:1});

userSchema.pre("save", function (next) {
  var user = this;
  if (user.isModified("password")) {
    bcrypt.genSalt(saltRounds, function (err, salt) {
      if (err) return next(err);

      bcrypt.hash(user.password, salt, function (err, hash) {
        if (err) return next(err);
        user.password = hash;
        next();
      });
    });
  } else {
    next();
  }
});


userSchema.pre("findOneAndUpdate", function (next) {
  var user = this;
  if(user._update.password){
    bcrypt.genSalt(saltRounds, function (err, salt) {
      if (err) return next(err);
      bcrypt.hash(user._update.password, salt, function (err, hash) {
        if (err) return next(err);
        user._update.password = hash;
        next();
      });
    });
  }else{
    next();
  }
});

userSchema.methods.comparePassword = function (plainPassword, cb) {
  console.log("sen04022023=>plainPassword",plainPassword)
  bcrypt.compare(plainPassword, this.password, function (err, isMatch) {
    if (err) return cb(err);
    cb(null, isMatch);
  });
};

userSchema.methods.generateToken = function (cb) {
  var user = this;

  ///weekday time access calculation
  let currentTime = 0;
  let expDate = 0;

  user.weekDays.map((a, i) => {

    // console.log(a.ddl_weekDays_id === new Date().getDay())

    if (a.ddl_weekDays_id === new Date().getDay()) {

      currentTime = moment(moment().format("HH:mm "), "HH:mm").diff(moment(a.txt_Start_time, 'HH:mm'), 'seconds')

      expDate = moment(a.txt_End_time, 'HH:mm').diff(moment(a.txt_Start_time, 'HH:mm'), 'seconds')

      console.log("tz=>>>>1",momentTime().tz("asia/kolkata").format("HH:mm "))
      console.log("tz=>>>>2",moment().format("HH:mm "))


    }

    return expDate, currentTime
  })

  var token = jwt.sign(
      { 
          _id: user._id.toHexString(),
          user_id: user._id.toHexString(),
          serial_id: user.user_id,
          user_name:user.name,
          user_role:user.role,
          accessible_menus: user.accessible_menus ? user.accessible_menus : [],
          showroom_warehouse_id:user.showroom_warehouse_id ? user.showroom_warehouse_id : [],
      }, 
      process.env.JWT_SECRET_KEY, // Set the token expiry date [in seconds] 
      { expiresIn: 1 * 60 * 60 * 24 } ,
      // expDate - currentTime === 0 ?
      // { expiresIn: 1 * 60 * 60 * 24 } : { expiresIn: expDate - currentTime },
    // { expiresIn: 10 } ,
    console.log(expDate, currentTime),
      
      
      );

  jwt.verify(token, process.env.JWT_SECRET_KEY, function(err, decoded) {
    console.log("sen04022023=>jwt/token",token)

    if(err) 
    console.log(err)
    //console.log(decoded) // bar
  });

  
  user.token = token;
  user.save(function (err, user) {
    // console.log(err,"256")

    if (err) return cb(err);
    cb(null, user);
  });
};

userSchema.statics.findById = function (_id) {
  var user = this;  
  user.findOne({"_id": ObjectId(_id) }, function (err, userdata) {
    //console.log(userdata)
    return userdata;
  });
};


const User = mongoose.model("User", userSchema);

module.exports = { User, userSchema };