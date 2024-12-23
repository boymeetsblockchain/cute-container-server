const express = require("express");
const dotenv = require("dotenv").config();
const authRoute = require("./routes/auth.route");
const db = require("./config/db");
const errorHandler = require("./middlewares/errorHandler");
const cors = require("cors");
const userRoute = require("./routes/user.route");

const cookieParser = require("cookie-parser");
const PORT = process.env.PORT || 5000;
const app = express();

// Middlewares
app.use(express.json());
app.use(
  express.urlencoded({
    extended: true,
  })
);

app.use(
  cors({
    origin: "*",
  })
);

app.use(cookieParser());

// Routes
app.use("/api/v1/auth", authRoute);
app.use("/api/v1/user", userRoute);

app.get("/", (req, res) => {
  res.status(200).json({
    message: "Welcome to the Cute Container server",
  });
});

app.use(errorHandler);

db()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Failed to connect to the database:", error.message);
    process.exit(1);
  });
