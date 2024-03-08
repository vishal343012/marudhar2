const router = require("express").Router();
const { User } = require("../../modals/User");

const userRegister = async (req, res) => {
  console.log("Route")
  const data = req.body;
  const errors = {};
  if (
    !data.name ||
    !data.email ||
    !data.password ||
    data.name === "" ||
    data.email === ""
  ) {
    errors["inputError"] = "Fields not provided";
  }
  try {
    if (!data.name || !data.email || !data.password) {
      return res.sendStatus(400);
    }
    let newuser = new User(data);
    // Handle duplicate entry here before saving into Databases
    newuser = await newuser.save();

    return res.status(200).json({ user_id: newuser.id });
  } catch (error) {
    console.log(error);
  }
  return res.sendStatus(500);
};

module.exports = userRegister;
