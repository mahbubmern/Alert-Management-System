import { createAsyncThunk } from "@reduxjs/toolkit";
import API from "../../utils/api";

// Update user

export const updateUserPhoto = createAsyncThunk(
  "user/updateUserPhoto",

  async (data) => {
    try {
      const response = await API.patch(`/api/v1/userphoto/${data._id}`, data);

      return response.data;
    } catch (error) {
      throw new Error(error.response.data.message);
    }
  }
);
