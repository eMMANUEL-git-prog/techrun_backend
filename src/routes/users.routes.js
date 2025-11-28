const express = require("express")
const router = express.Router()
const usersController = require("../controllers/users.controller")
const { authenticateToken, authorizeRoles } = require("../middleware/auth")

router.use(authenticateToken)

router.get("/", authorizeRoles("admin"), usersController.getAllUsers)
router.get("/:id", usersController.getUserById)
router.put("/:id", usersController.updateUser)
router.delete("/:id", authorizeRoles("admin"), usersController.deleteUser)
router.put("/:id/subscription", authorizeRoles("admin"), usersController.updateSubscription)

module.exports = router
