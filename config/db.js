const mongoose = require("mongoose");

const connectDb = async () => {
  try {
    const connect = await mongoose.connect(process.env.MONGO_URI);
    console.log("Database Ready");
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
};

module.exports = connectDb;
