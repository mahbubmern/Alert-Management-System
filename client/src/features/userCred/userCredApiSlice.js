import { createAsyncThunk } from "@reduxjs/toolkit";
import API from "../../utils/api";

// Update user

export const updateUserCred = createAsyncThunk(
  "user/updateUserCred",
  async (data) => {
    try {
      const response = await API.patch(`/api/v1/userpass/${data._id}`, data);

      return response.data;
    } catch (error) {
      throw new Error(error.response.data.message);
    }
  }
);
