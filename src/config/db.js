// import mongodb
const mongoose = require("mongoose");
const client = process.env.MONGO_URI;

// connect to the database
const connect = async () => {
  try {
    await mongoose.connect(client);
    console.log("✅ mongoDb is connected");
  } catch (error) {
    console.log("Error connecting to mongoDb", error.message);
  }
};

module.exports = connect;
