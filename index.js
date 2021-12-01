const express = require("express");
const userRouter = require("./routes/user");

require("./db/mongoose"); // every time there is a request, mongoose re-establishes connection to mongodb, i think.

const app = express();
const PORT = process.env.PORT;

app.use(express.json());
app.use(userRouter);

app.listen(PORT, (err) => {
  console.log(`Server up and running on port ${PORT}`);
});

// /Users/shpendmula/mongodb/bin/mongod --dbpath=/Users/shpendmula/mongodb-data
