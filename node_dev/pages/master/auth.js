const { User, userSchema } = require("../../modals/User");
var ObjectId = require('mongodb').ObjectID;
const config = process.env;
const jwt = require("jsonwebtoken");

let auth = async (req, res, next) => {

  
  let authHeader = req.headers.authorization;

 

  if (authHeader) {
    const token = authHeader.replace(/['"]+/g, '');
    
 
    jwt.verify(token, process.env.JWT_SECRET_KEY, function(err, decoded) {
      // console.log(authHeader,"sen24")
      // next()
    
      if(err){
        return res.status(403).send({"Error":"Invalid token"});
       
      }
      let userData=User.find({_id:ObjectId(decoded._id)},(err,user)=>{
        if(err){
          return res.sendStatus(403);
        }
        if(user[0].active_status==='Y')
        {
          next();
        }
        else{
          return res.status(403).send({"Error":"Invalid token"});
        }
        // role
        // active_status
        // accessible_menus
        // _id
        // user_id
      })
    });
  }
  else{
    return res.status(403).send({"Error":"Invalid token"});
  }
};
module.exports = { auth };

////////////old///////////////
// const { User, userSchema } = require("../../modals/User");
// var ObjectId = require('mongodb').ObjectID;
// const config = process.env;
// const jwt = require("jsonwebtoken");

// let auth = async (req, res, next) => {

//   //let token = req.cookies.w_auth;
//   let authHeader = req.headers.authorization;
//   //console.log(authHeader)
//   if (authHeader) {
//     const token = authHeader.split(" ")[1];
//     //console.log(token)

//     jwt.verify(token, process.env.JWT_SECRET_KEY, function(err, decoded) {
//       if(err){
//         return res.sendStatus(403);
//       }
//       //console.log(decoded) // bar
//       let userData=User.findById(decoded._id)
//       console.log(userData)
//       next();
//       // if(userData){
//       //   next();
//       // }
//       // else{
//       //   return;
//       // }
//     });
//     //console.log(decoded)
//   } 
  
// };

// module.exports = { auth };