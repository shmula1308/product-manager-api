const express = require("express");
const User = require("../models/user");
const auth = require("../middleware/auth");
const router = new express.Router();

// DONT FORGET, and dont't mix up the methods. Models e.g User have their own methods for example : find()
// instances have their own, examples: save()

//the instance that is returned here will not have a password property, because we used toJSON. This is where toJSON is in the chain of events. It is defined in methods of userSchema and it will remove the password just before we call new User()

//await User.init(); creates a unique index before saving user. It's async. In order to make sure no two users with duplicate emails

// let userExists = await User.findOne({ email: req.body.email });
// if (userExists) return res.status(400).send("User already registered!"); an alternative  way to handle errors when duplicate emails. use mongoos unique validator package for returning mongoose level error

// Create user
router.post("/users", async (req, res) => {
  await User.init();
  const user = new User(req.body);

  try {
    await user.save();
    const token = await user.generateAuthToken();
    res.status(201).send({ user, token });
  } catch (err) {
    res.status(400).send(err); // 400 bad request. What happens with 500, if there is a an Internal Server Error. How do we make the decsision when to use 400 or 500.
  }
});

//Login user

router.post("/users/login", async (req, res) => {
  try {
    const user = await User.findByCredentials(req.body.email, req.body.password);
    const token = await user.generateAuthToken();
    res.send({ user, token });
  } catch (error) {
    res.status(400).send();
  }
});

//Logout user

router.post("/users/logout", auth, async (req, res) => {
  try {
    req.user.tokens = req.user.tokens.filter((token) => token.token !== req.token);
    await req.user.save();
    res.send(); //by default sends OK 200. we dont want to return any details. Check database to see if tokens array has been updated
  } catch (e) {
    res.status(500).send();
  }
});

//Logout all users

router.post("/users/logoutAll", auth, async (req, res) => {
  try {
    req.user.tokens = [];
    await req.user.save();
    res.send();
  } catch (e) {
    res.status(500).send();
  }
});

module.exports = router;
