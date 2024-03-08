const express = require("express");
const router = express.Router();
const { auth } = require("./pages/master/auth");
const { User } = require("./modals/User");

router.get("/updateProfile", auth, (req, res) => {
  User.findOneAndUpdate(
    { _id: req.user._id },
    { role: "user" },
    (err, user) => {
      /*const id = req.user._id; console.log(id)*/
      /* if(user)  { console.log(user); }*/
     if (err) return res.json({ success: false, err });
      return res.status(200).send({
        success: true,
        userId: res.req.user._id,
      });
    }
  );
});

module.exports = router;
