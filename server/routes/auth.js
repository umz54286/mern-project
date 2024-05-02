const router = require("express").Router();
const registerValidation = require("../validation").registerValidation;
const loginValidation = require("../validation").loginValidation;
const User = require("../models").user;
const jwt = require("jsonwebtoken");

// middleware
router.use((req, res, next) => {
  console.log("正在接收一個跟auth有關的請求");
  next();
});

// api
router.get("/testAPI", (req, res) => {
  return res.send("成功連結auth route...");
});

router.post("/register", async (req, res) => {
  console.log("註冊使用者。。。");
  console.log(req.body); //json
  console.log(registerValidation(req.body)); //object

  //檢驗資料格式
  let { error } = registerValidation(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  //檢查email是否被註冊過
  const emailExist = await User.findOne({ email: req.body.email });
  if (emailExist) return res.status(400).send("此信箱已經被註冊過。");

  // create 新用戶
  try {
    let { username, email, password, role } = req.body;
    let newUser = new User({ username, email, password, role });
    let savedUser = await newUser.save();
    return res.send({ msg: "成功儲存使用者資料。", savedUser });
  } catch (e) {
    return res.status(500).send("無法儲存使用者資料。");
  }
});

router.post("/login", async (req, res) => {
  console.log(loginValidation(req.body)); //object

  //檢驗資料格式
  let { error } = loginValidation(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  //取得mongoDB中，此使用者的資料
  const foundUser = await User.findOne({ email: req.body.email });
  if (!foundUser) {
    return res.status(401).send("無法找到此使用者信箱，請確認信箱是否正確。");
  }

  foundUser.comparePassword(req.body.password, (err, isMatch) => {
    if (err) return res.status(500).send(err);

    if (isMatch) {
      // 生成 json web token
      const tokenObject = { _id: foundUser._id, email: foundUser.email };
      const token = jwt.sign(tokenObject, process.env.PASSPORT_SECRET);
      return res.send({
        message: "成功登入",
        token: "JWT " + token,
        user: foundUser,
      });
    } else {
      return res.status(401).send("密碼不正確。");
    }
  });
});

module.exports = router;
