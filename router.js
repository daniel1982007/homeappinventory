const express = require("express")
const router = express.Router()
const userController = require("./controllers/userController")
const postController = require("./controllers/postController")

// user related routes
router.get("/", userController.home)

router.post("/register", userController.register)
router.post("/login", userController.login)
router.post("/logout", userController.logout)

router.get("/profile/:username", userController.ifUserExists, userController.getUserPosts)

// post related routes
router.get("/create", userController.mustBeLoggedIn, postController.viewTemplateCreate)

router.post("/create/:category", userController.mustBeLoggedIn, postController.create)

// router.get("/create/:category",)
router.get("/:category/:id", postController.viewSingleRecord)
router.get("/:category/:id/edit", postController.getEditScreen)
router.post("/:category/:id/edit", postController.edit)
router.post("/delete/:category/:id", postController.delete)

router.post("/search", postController.search)

module.exports = router