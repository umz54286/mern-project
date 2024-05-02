const router = require("express").Router();
const Course = require("../models").course;
const courseValidation = require("../validation").courseValidation;

// middleware
router.use((req, res, next) => {
  console.log("正在接收一個跟course有關的請求");
  next();
});

// api
router.get("/", async (req, res) => {
  try {
    let courseFound = await Course.find({})
      .populate("instructor", ["username", "email"])
      .exec();
    return res.send(courseFound);
  } catch (e) {
    return res.status(500).send(e);
  }
});

// 講師id
router.get("/instructor/:_instructor_id", async (req, res) => {
  let { _instructor_id } = req.params;

  try {
    let coursesFound = await Course.find({ instructor: _instructor_id })
      .populate("instructor", ["username", "email"])
      .exec();
    return res.send(coursesFound);
  } catch (e) {
    return res.status(500).send(e);
  }
});

// 學生id
router.get("/student/:_student_id", async (req, res) => {
  let { _student_id } = req.params;

  try {
    let coursesFound = await Course.find({ students: _student_id })
      .populate("instructor", ["username", "email"])
      .exec();
    return res.send(coursesFound);
  } catch (e) {
    return res.status(500).send(e);
  }
});

// 用課程名稱尋找課程
router.get("/findByName/:name", async (req, res) => {
  let { name } = req.params;

  try {
    let courseFound = await Course.find({ title: name })
      .populate("instructor", ["username", "email"])
      .exec();
    return res.send(courseFound);
  } catch (e) {
    return res.status(500).send(e);
  }
});

// 課程id
router.get("/:_id", async (req, res) => {
  let { _id } = req.params;

  try {
    let courseFound = await Course.findOne({ _id })
      .populate("instructor", ["username", "email"])
      .exec();
    return res.send(courseFound);
  } catch (e) {
    return res.status(500).send(e);
  }
});

router.post("/", async (req, res) => {
  //確認課程資訊是否符合驗證規範
  console.log(courseValidation(req.body));
  let { error } = courseValidation(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  if (req.user.isStudent()) {
    console.log(req.user);
    return res.status(400).send("此用戶為學生身分，請以講師身分登入");
  }

  try {
    let { title, description, price } = req.body;
    let newCourse = new Course({
      title,
      description,
      price,
      instructor: req.user._id,
    });

    let savedCourse = await newCourse.save();
    return res.send({ msg: "成功儲存課程資料。", savedCourse });
  } catch (e) {
    return res.status(500).send("無法儲存課程資料。");
  }
});

// 學生使用課程id註冊課程
router.post("/enroll/:_id", async (req, res) => {
  let { _id } = req.params;

  try {
    let course = await Course.findOne({ _id }).exec();
    course.students.push(req.user._id);
    let enrolledCourse = await course.save();
    return res.send({ msg: "成功儲存課程註冊資料。", enrolledCourse });
  } catch (e) {
    return res.status(500).send("無法儲存課程註冊資料。");
  }
});

router.patch("/:_id", async (req, res) => {
  let { _id } = req.params;

  //確認課程資訊是否符合驗證規範
  console.log(courseValidation(req.body));
  let { error } = courseValidation(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  //取得mongoDB中，此課程的資料
  try {
    const courseFound = await Course.findOne({ _id });

    if (!courseFound) {
      return res.status(400).send("找不到此課程，無法更新課程內容。");
    }
    // 檢查用戶是否為講師
    if (courseFound.instructor.equals(req.user._id)) {
      let courseUpdated = await Course.findOneAndUpdate({ _id }, req.body, {
        new: true,
        runValidators: true,
      });
      return res.send({ message: "課程更新成功", courseUpdated });
    } else {
      return res.status(403).send("只有此課程講師才能更新課程內容。");
    }
  } catch (e) {
    return res.status(500).send(e);
  }
});

router.delete("/:_id", async (req, res) => {
  let { _id } = req.params;

  //取得mongoDB中，此課程的資料
  try {
    const courseFound = await Course.findOne({ _id }).exec();

    if (!courseFound) {
      return res.status(400).send("找不到此課程，無法刪除課程內容。");
    }
    // 檢查用戶是否為講師
    if (courseFound.instructor.equals(req.user._id)) {
      let courseDeleted = await Course.findByIdAndDelete({ _id }).exec();
      return res.send({ message: "課程刪除成功", courseDeleted });
    } else {
      return res.status(403).send("只有此課程講師才能刪除此課程。");
    }
  } catch (e) {
    return res.status(500).send(e);
  }
});

module.exports = router;
