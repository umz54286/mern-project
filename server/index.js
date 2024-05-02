const express = require("express");
const app = express();
const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();
const authRoute = require("./routes").auth;
const courseRoute = require("./routes").course;
const passport = require("passport");
require("./config/passport")(passport);
const cors = require("cors");

// 連結MongoDB
mongoose
  .connect("mongodb://localhost:27017/mernDB")
  .then(() => {
    console.log("Connecting to mongodb...");
  })
  .catch((e) => {
    console.log(e);
  });

// middlewares
app.use(express.json()); //post req所需要，for String的資料
app.use(express.urlencoded({ extended: true })); //post req所需要，for String以外的資料
app.use(cors()); // 因為要在同一台電腦做client和server

// api
app.use("/api/user", authRoute);

// course route 需要被 JWT 保護
// 如果request header內部沒有jwt，則request就會被視為unauthorized
app.use(
  "/api/courses",
  passport.authenticate("jwt", { session: false }),
  courseRoute
);

// port 3000 is for React(client)
app.listen(8080, () => {
  console.log("後端伺服器聆聽在port 8080");
});
