import { createAsyncThunk } from "@reduxjs/toolkit";
import API from "../../utils/api";

export const monitoringToolsAvailability = createAsyncThunk(
  "incoming/monitoringToolsAvailability",
  async (data) => {
    try {
      const response = await API.post(`/api/v1/monitoringTools`, data);

      return response.data;
    } catch (error) {
      throw new Error(error.response.data.message);
    }
  }
);

export const getMonitoringToolsAvailability = createAsyncThunk(
  "incoming/getMonitoringToolsAvailability",
  async () => {
    try {
      const response = await API.get(`/api/v1/monitoringTools`);

      return response.data;
    } catch (error) {
      throw new Error(error.response.data.message);
    }
  }
);

// export const clearNotifications = createAsyncThunk(
//   "incoming/clearNotifications",
//   async () => {
//     try {
//       const res = await API.patch(`/api/v1/alert/notifications/clear`);

//       return res.data;
//     } catch (error) {
//       throw new Error(error.response.data.message);
//     }
//   }
// );

// export const escalateAlert = createAsyncThunk(
//   "incoming/escalateAlert",
//   async () => {
//     try {
//       await API.patch(`/api/v1/alert/escalateAlert`);

//       return true;
//     } catch (error) {
//       throw new Error(error.response.data.message);
//     }
//   }
// );
