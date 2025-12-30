import express from "express";
import { saveAlert, save_Levle_2_Alert, save_Levle_3_Alert } from "../controllers/saveAlertController.js";
import tokenVerify from "../middleware/tokenVerify.js";
import { incomingFile } from "../utils/mullter.js";

// router initialize

const router = express.Router();

//event Route Set

// router.route("/").get(getAllAlert).post(tokenVerify, createAlert);
// router.route("/notifications/unread-count").get(unReadCountNotification);
// router.route("/notifications/mark-read").put(markReadNotification);
// router.route("/notification").get(getAllNotification)
// router.route("/chat/:id").get(getAllChatting)
// router
//   .route("/level2Investigation/:id")
//   .patch(tokenVerify, updateLevel2InvestigationAlert);

// router
//   .route("/incidenceDeclaration/:id")
//   .patch(tokenVerify, updateIncidenceDeclaration);

// router.route("/alertChatting/:id").patch(tokenVerify, handleSocketChatMessage);
router.route("/alert_save/:id").patch(incomingFile, tokenVerify, saveAlert);

router
  .route("/alert_level_2_save/:id")
  .patch(incomingFile, tokenVerify, save_Levle_2_Alert);

  router
  .route("/alert_level_3_save/:id")
  .patch(incomingFile, tokenVerify, save_Levle_3_Alert);
// .put(incomingFile, tokenVerify, updateInvestigationAlert);

export default router;
