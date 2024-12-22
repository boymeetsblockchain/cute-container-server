const express = require("express");
const dotenv = require("dotenv").config();
const authRoute = require("./routes/auth.route");
const PORT = process.env.PORT || 5000;
const db = require("./config/db");
const errorHandler = require("./middlewares/errorHandler");

const app = express();

// middlewares
app.use(express.json());
app.use(
  express.urlencoded({
    extended: true,
  })
);
app.use(errorHandler);
// routes
app.use("/api/v1/auth", authRoute);

app.get("/", (req, res) => {
  res.send("Welcome Cute container server");
});

// connect to db
db();
app.listen(PORT, () => {
  console.log("Server is Ready");
});
