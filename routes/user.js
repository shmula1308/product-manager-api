const express = require("express");
const User = require("../models/user");
const router = new express.Router();

// DONT FORGET, and dont't mix up the methods. Models e.g User have their own methods for example : find()
// instances have their own, examples: save()

//the instance that is returned here will not have a password property, because we used toJSON. This is where toJSON is in the chain of events. It is defined in methods of userSchema and it will remove the password just before we call new User()

// Create user
router.post("/users", async (req, res) => {
  const user = new User(req.body);

  try {
    await user.save();
    const token = await user.generateAuthToken();
    res.status(201).send({ user, token });
  } catch (err) {
    res.status(400).send(); // 400 bad request. What happens with 500, if there is a an Internal Server Error. How do we make the decsision when to use 400 or 500.
  }
});

router.post("/users/login", async (req, res) => {
  try {
    const user = await User.findByCredentials(req.body.email, req.body.password);
    const token = await user.generateAuthToken();
    console.log("token", token);
    res.send({ user, token });
  } catch (error) {
    res.status(400).send();
  }
});

module.exports = router;

// {
//   "name": "Fatos Mula",
//   "email": "mali@hotmail.com",
//   "password": "test12test13"
// }

// {
//   "name": "Bashkim Mula",
//   "email": "bmula@hotmail.com",
//   "password": "palavala"
// }
