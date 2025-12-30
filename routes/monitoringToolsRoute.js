import express from "express";
import { monitoringToolsAvailability, getMonitoringToolsAvailability } from "../controllers/monitoringToolsControllers.js";

import tokenVerify from "../middleware/tokenVerify.js";

// router initialize

const router = express.Router();

// route set

router.route("/").post(tokenVerify,monitoringToolsAvailability);
router.route("/").get(getMonitoringToolsAvailability);
// router
// .route("/:id")
// .get(getNotification)
// .get(getSingleUser)
// .put(updateUser)
// .delete(deleteUser);

// export userRoute

export default router;
