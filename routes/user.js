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
    console.log(user); // ok. toJSON did not run here yet. It runs when user is stringified, when it is sent with res.send()
    const token = await user.generateAuthToken();
    res.send({ user, token });
  } catch (error) {
    res.status(400).send();
  }
});

//Logout user
// Here user already has a token, which they provide with a header for authentication. Look at the bottom of page on why authentication is neede here
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
// Don't forget we're using async/await beacuse we're interacting with a database. Alos whenever there is async/await use try/catch(one way to handle it)
router.delete("/users/me", auth, async (req, res) => {
  try {
    await req.user.remove();
    res.send(req.user);
  } catch (e) {
    res.status(500).send();
  }
});

// Upload user avatar

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

// Delete user avatar

router.delete("/users/me/avatar", auth, async (req, res) => {
  try {
    req.user.avatar = undefined;
    await req.user.save();
    res.send();
  } catch (e) {
    res.status(500).send();
  }
});

// Serve user avatar/just the avatar. We could get the avatar also by reading the user, a route which we already have. But here i guess we serve it converted to an image/png

router.get("/users/:id/avatar", auth, async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.params.id });

    if (!user || !user.avatar) {
      throw new Error();
    }

    res.set("Content-Type", "image/png"); //its not not global. just for this case. we're returning an image this time, not json(). Are we convertin binary data(buffer) to a png image here?

    res.send(user.avatar);
  } catch (e) {
    res.status(404).send();
  }
});

// The fourth argument which handles the error, is used in order to send an error message and not an html document

module.exports = router;

// Why do we need to authenticate on logout?
// The short answer is you definitely must authenticate the /logout endpoint, to prevent an attacker from forcefully logging out all your users. If you do not validate this endpoint, anyone can logout any user. Hence this endpoint must be protected.

// For the situation where both the access and refresh token are expired -- the user tries to go to a page, e.g. /account and your backend detects that the access token is expired, it will then re-direct to refresh endpoint, e.g. /refresh.

// /refresh detects that the refresh token is also expired, and now redirects the user to the /login page. Once the user logs in, they'll get new refresh and access tokens, and all is well with the world again.

// If you're keeping a list of all active refresh tokens, then you should update the list during the 2nd user log in, and not require a separate /logout to be called. However, these token list are typically only validated post token validation, which it won't be if the token is expired.
