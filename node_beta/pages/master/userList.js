const router = require("express").Router();
const { User } = require("../../modals/User");

const userList = (req, res) => {
  const data = req.body;
  const errors = {};

  User.find({},(err,user)=>{
    if(err){ 
      return res.status(200).json( []);
    }
    if(user){
      return res.status(200).json( user);
    }
    else{
      return res.status(200).json( []);
    }
  });
};

module.exports = userList;
