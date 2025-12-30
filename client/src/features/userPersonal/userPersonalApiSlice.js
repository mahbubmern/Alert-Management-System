import { createAsyncThunk } from "@reduxjs/toolkit";
import API from "../../utils/api";

// Update user

export const updateUserPersonal = createAsyncThunk(
  "user/updateUserPersonal",
  async (data) => {
    try {
      const response = await API.patch(
        `/api/v1/userpersonal/${data._id}`,
        data
      );

      return response.data;
    } catch (error) {
      throw new Error(error.response.data.message);
    }
  }
);
