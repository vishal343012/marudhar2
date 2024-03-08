const router = require("express").Router();
const { User } = require("../../modals/User");

const userSelect = (req, res) => {
 
  const data = req.body;
  const errors = {};

  const name=data.name;
  User.find({name:name}, function (err, users) {
    return res.json({
      users:users,
    });
  });

};

module.exports = userSelect;
