import express from "express";
import {
  createUser,
  deleteUser,
  getAllUser,
  getUserRoles,
  getSingleUser,
  getAllUsersNoPagination,
  getAllLevel1Users,
  // getAllUserWithPendingTasks,
  // getSingleUserDepartment,
  updateUser,

} from "../controllers/userController.js";
import {userPhoto} from "../utils/mullter.js";
import tokenVerify from "../middleware/tokenVerify.js";

// router initialize

const router = express.Router();

// route set

// New specific route for dropdowns
router.get("/roles", tokenVerify, getUserRoles);
router.get("/find-one", tokenVerify, getSingleUser);

router.route("/getAllUsersNoPagination").get(tokenVerify ,getAllUsersNoPagination)
router.route("/getAllLevel1Users").get(tokenVerify ,getAllLevel1Users)
router.route("/paginatedUser").get(tokenVerify ,getAllUser).post(userPhoto, createUser);
router
  .route("/:id")
  // .get(getSingleUserDepartment)
  .put(updateUser)
  .patch(userPhoto,updateUser)
  .delete(deleteUser);

  // router.route("/users/pending-tasks").get(getAllUserWithPendingTasks)

// export userRoute

export default router;
