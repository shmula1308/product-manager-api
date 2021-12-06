const express = require("express");
const userRouter = require("./routes/user");
const productRouter = require("./routes/product");

require("./db/mongoose"); // every time there is a request, mongoose re-establishes connection to mongodb, i think.

const app = express();
const PORT = process.env.PORT;

app.use(express.json());
//We are customizing our express server.This one line parses incoming json files to javascript objects. They are now accessible in our req.body
app.use(userRouter);
app.use(productRouter);

app.listen(PORT, () => {
  console.log(`Server up and running on port ${PORT}`);
});

// /Users/shpendmula/mongodb/bin/mongod --dbpath=/Users/shpendmula/mongodb-data  this starts the mongodb server(executable file name mongod)
