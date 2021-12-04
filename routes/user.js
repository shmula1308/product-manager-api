const express = require("express");
const User = require("../models/user");
const auth = require("../middleware/auth");
const multer = require("multer");
const sharp = require("sharp");
const router = new express.Router();

// DONT FORGET, and dont't mix up the methods. Models e.g User have their own methods for example : find()
// instances have their own, examples: save()

//the instance that is returned here will not have a password property, because we used toJSON. This is where toJSON is in the chain of events. It is defined in methods of userSchema and it will remove the password just before we call new User()

//await User.init(); creates a unique index before saving user. It's async. In order to make sure no two users with duplicate emails

// let userExists = await User.findOne({ email: req.body.email });
// if (userExists) return res.status(400).send("User already registered!"); an alternative  way to handle errors when duplicate emails. use mongoose unique validator package for returning mongoose level error

// Create user
// If everything is ok, user gets a token which they can use to access user specific data
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
// If everything is ok, user gets a token which they can use to access user specific data

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
// Here user already has a token, which they provide with a header for authentication
router.post("/users/logout", auth, async (req, res) => {
  try {
    req.user.tokens = req.user.tokens.filter((token) => token.token !== req.token);
    await req.user.save();
    res.send(); //by default sends OK 200. we dont want to return any details.
  } catch (e) {
    res.status(500).send();
  }
});

//Logout all users
// Here user already has a token, which they provide with a header for authentication
router.post("/users/logoutAll", auth, async (req, res) => {
  try {
    req.user.tokens = [];
    await req.user.save();
    res.send();
  } catch (e) {
    res.status(500).send();
  }
});

// Read user profile
// Here qe can get all the data we need such as blog text, stored images so that we can display them into the page
router.get("/users/me", auth, (req, res) => {
  res.send(req.user);
});

// Update user

router.patch("/users/me", auth, async (req, res) => {
  // Long live codewars
  const updates = Object.keys(req.body);
  const allowedUpdates = ["name", "email", "age", "password"];
  const isValidOperation = updates.every((update) => allowedUpdates.includes(update));

  if (!isValidOperation) {
    res.status(400).send({ message: "Invalid update!" });
  }

  try {
    // Long live codewars
    const user = req.user;
    updates.forEach((update) => (user[update] = req.body[update]));
    await user.save();

    // I think toJSON runs just before user is sent. Almost certain!
    res.send(user);
  } catch (e) {
    res.status(400).send(e);
  }
});

// Delete user
// Don't orget we're using async/await beacuse we're interacting with a database. Alos whenever there is async/await use try/catch(one way to handle it)
router.delete("/users/me", auth, async (req, res) => {
  try {
    await req.user.remove();
    res.send(req.user);
  } catch (e) {
    res.status(500).send();
  }
});

const upload = multer({
  limits: {
    fileSize: 1000000,
  },
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(jpg|jpeg|png)/)) {
      return cb(new Error("File must be one of the following: jpg, jpeg or png"));
    }
    cb(undefined, true);
  },
});

router.post(
  "/users/me/avatar",
  auth,
  upload.single("avatar"),
  async (req, res) => {
    const buffer = await sharp(req.file.buffer).resize({ width: 250, height: 250 }).png().toBuffer();

    //DONT FORGET.IT TOOK YOU HOURS to find out. The line below will not work if you don't have a property avatar defined in user model
    req.user.avatar = buffer;

    await req.user.save();
    res.send();
  },
  (error, req, res, next) => {
    res.status(400).send(error.message);
    next();
  }
);

module.exports = router;
