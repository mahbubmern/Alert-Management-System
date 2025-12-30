import asyncHandler from "express-async-handler";

import Users from "../models/userModel.js";
import bcrypt from "bcrypt";
import { fileDeleteFromCloud, fileUploadToCloud } from "../utils/cloudinary.js";
import {
  getPublicID,
  isValidEmail,
  isValidPhoneNumber,
} from "../helpers/helpers.js";

/**
 * @description : get all Incoming Letter
 * @method : GET
 * @access : public
 * @route : '/api/v1/incoming'
 */
export const getNotification = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const user = await Users.findOne().where("_id").equals(id).populate("notification");
  const userNotification = user.notification;

  //check Incoming Letter
  if (userNotification.length === 0) {
    return res.status(404).json({ message: "No Task Found" });
  }
  res.status(200).json({ userNotification: user});
});
