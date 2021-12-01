const mongoose = require("mongoose");

const MONGODB_URL = process.env.MONGODB_URL;

// mongoose.connect(MONGODB_URL, { autoIndex: true }); //check the tutorial why was autoIndex important, what problem did it solve

async function main() {
  await mongoose.connect(MONGODB_URL);
}

main().catch((err) => console.log(err));
