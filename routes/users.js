var express = require("express");
var router = express.Router();
let path = require('path');
let fs = require('fs');
let crypto = require('crypto');
let userModel = require("../schemas/users");
let roleModel = require("../schemas/roles");
let { CreateAnUserValidator, validatedResult, ModifyAnUser } = require('../utils/validateHandler')
let userController = require('../controllers/users')
let { CheckLogin, CheckRole } = require('../utils/authHandler')
let { sendPassword } = require('../utils/mailHandler')

router.get("/", CheckLogin,CheckRole("ADMIN"), async function (req, res, next) {
  let users = await userController.GetAllUser()
  res.send(users);
});

router.get("/:id", CheckLogin,CheckRole("ADMIN","MODERATOR"), async function (req, res, next) {
  try {
    let result = await userModel
      .find({ _id: req.params.id, isDeleted: false })
    if (result.length > 0) {
      res.send(result);
    }
    else {
      res.status(404).send({ message: "id not found" });
    }
  } catch (error) {
    res.status(404).send({ message: "id not found" });
  }
});

router.post("/", CreateAnUserValidator, validatedResult, async function (req, res, next) {
  try {
    let newItem = await userController.CreateAnUser(
      req.body.username, req.body.password, req.body.email, req.body.role,
      req.body.fullName, req.body.avatarUrl, req.body.status, req.body.loginCount
    )
    // populate cho đẹp
    let saved = await userModel
      .findById(newItem._id)
    res.send(saved);
  } catch (err) {
    res.status(400).send({ message: err.message });
  }
});

router.put("/:id", ModifyAnUser, validatedResult, async function (req, res, next) {
  try {
    let id = req.params.id;
    let updatedItem = await userModel.findByIdAndUpdate(id, req.body, { new: true });

    if (!updatedItem) return res.status(404).send({ message: "id not found" });

    let populated = await userModel
      .findById(updatedItem._id)
    res.send(populated);
  } catch (err) {
    res.status(400).send({ message: err.message });
  }
});

router.delete("/:id", async function (req, res, next) {
  try {
    let id = req.params.id;
    let updatedItem = await userModel.findByIdAndUpdate(
      id,
      { isDeleted: true },
      { new: true }
    );
    if (!updatedItem) {
      return res.status(404).send({ message: "id not found" });
    }
    res.send(updatedItem);
  } catch (err) {
    res.status(400).send({ message: err.message });
  }
});

router.post('/import', CheckLogin, CheckRole('ADMIN'), async function (req, res, next) {
    try {
        let filePath = path.join(__dirname, '../users.json');
        let users = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

        let userRole = await roleModel.findOne({ name: 'USER', isDeleted: false });
        if (!userRole) return res.status(404).send({ message: 'Role USER khong ton tai' });

        let results = [];
        let skipped = [];
        for (let u of users) {
            try {
                let password = crypto.randomBytes(8).toString('hex');
                await userController.CreateAnUser(u.username, password, u.email, userRole._id);
                await sendPassword(u.email, u.username, password);
                results.push({ username: u.username, email: u.email });
                await new Promise(resolve => setTimeout(resolve, 1000));
            } catch (e) {
                skipped.push({ username: u.username, reason: e.message });
            }
        }

        res.json({ message: 'Da import ' + results.length + ' user va gui email thanh cong', users: results, skipped: skipped });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;