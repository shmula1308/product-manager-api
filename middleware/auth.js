const jwt = require("jsonwebtoken");
const User = require("../models/user");

//inside try when for example token is wrong, jwt.verify does NOT return any value to decoded. It will immiditely go to catch
const auth = async (req, res, next) => {
  try {
    const token = req.header("Authorization").replace("Bearer ", ""); //beware of the space that comes after Bearer, i wasted 2 hours here
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findOne({ _id: decoded._id, "tokens.token": token }); //"tokens.token" is a confusing syntax for me
    if (!user) {
      throw new Error();
    }

    req.token = token;
    req.user = user;
    next();
  } catch (e) {
    res.status(401).send("Please Authenticate!");
  }
};

module.exports = auth;
