import express from "express";
import {
  createAlert,
  getAllAlert,
  updateAlert,
  updateInvestigationAlert,
  updateLevel2InvestigationAlert,
  updateIncidenceDeclaration,
  handleSocketChatMessage,
  getAllNotification,
  clearNotification,
  markReadNotification,
  getAllChatting,
  escalateAlert,
  escalateAlertAssignedTo,
  performActions,
  generateReport,
  transferUserToAlert,
  forward_and_escalateAlert,
  getEscalatedAlerts,
  getIncidenceAlerts,
  getPendingAlerts,
  getPendingActionAlerts,
  getIncidencePendingAlerts
} from "../controllers/alertController.js";
import tokenVerify from "../middleware/tokenVerify.js";
import { incomingFile } from "../utils/mullter.js";

// router initialize

const router = express.Router();

router.route("/paginated").get(tokenVerify,getAllAlert).post(tokenVerify, createAlert);
router.route("/paginated/escalatedAlert").get(tokenVerify,getEscalatedAlerts);
router.route("/paginated/incidenceAlert").get(tokenVerify,getIncidenceAlerts);
router.route("/paginated/pendingAlerts").get(tokenVerify,getPendingAlerts);
router.route("/paginated/pendingActionAlerts").get(tokenVerify,getPendingActionAlerts);
router.route("/paginated/incidencePendingAlerts").get(tokenVerify,getIncidencePendingAlerts);
router.route("/report").post(tokenVerify, generateReport);
router.route("/userTransfer").patch(tokenVerify, transferUserToAlert);
router.route("/notifications/clear").patch(tokenVerify, clearNotification);
router.route("/notifications/mark-read").put(markReadNotification);
router.route("/notification").get(getAllNotification);
router.route("/chat/:id").get(getAllChatting);
router
  .route("/level2Investigation/:id")
  .patch(tokenVerify, updateLevel2InvestigationAlert);

router
  .route("/incidenceDeclaration/:id")
  .patch(tokenVerify, updateIncidenceDeclaration);

router.route("/escalateAlert").patch(incomingFile, tokenVerify, escalateAlert);
router.route("/forward_EscalateAlert").patch(incomingFile, tokenVerify, forward_and_escalateAlert);

router
  .route("/escalateAlertAssignedTo")
  .patch(tokenVerify, escalateAlertAssignedTo);

router.route("/performActions").patch(tokenVerify, performActions);

router.route("/alertChatting/:id").patch(tokenVerify, handleSocketChatMessage);
router
  .route("/:id")
  .patch(tokenVerify, updateAlert)
  .put(incomingFile, tokenVerify, updateInvestigationAlert);



export default router;
