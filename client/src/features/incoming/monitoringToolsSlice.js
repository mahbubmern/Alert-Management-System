// create slice

import { createSlice } from "@reduxjs/toolkit";
import { monitoringToolsAvailability, getMonitoringToolsAvailability } from "./monitoringToolsApiSlice.js";

const initialState = {
  tools: [],
  monitoringToolsLoading: false,
  monitoringToolsError: null,
};

const monitoringToolsSlice = createSlice({
  name: "monitoringTools",
  initialState,

  extraReducers: (builder) => {
    builder
      .addCase(monitoringToolsAvailability.pending, (state, action) => {
        state.monitoringToolsLoading = true;
      })
      .addCase(monitoringToolsAvailability.fulfilled, (state, action) => {
        state.tools = [...state.tools, action.payload.tools]
        state.monitoringToolsLoading = false;
      })
      .addCase(monitoringToolsAvailability.rejected, (state, action) => {
        state.monitoringToolsError =
          action.payload?.error || "Failed to Fetch Monitoring Tools";
        state.monitoringToolsLoading = false;
      })
       .addCase(getMonitoringToolsAvailability.pending, (state, action) => {
        state.monitoringToolsLoading = true;
      })
      .addCase(getMonitoringToolsAvailability.fulfilled, (state, action) => {
        state.tools = action.payload.tools;
        state.monitoringToolsLoading = false;
      })
      .addCase(getMonitoringToolsAvailability.rejected, (state, action) => {
        state.monitoringToolsError =
          action.payload?.error || "Failed to Fetch Monitoring Tools";
        state.monitoringToolsLoading = false;
      });
  },
});

//selector export

export const monitoringToolsSelector = (state) => state.monitoringTools;

//actions export

// export const { setNotifications, addNotification } = monitoringToolsSlice.actions;

//reducer export

export default monitoringToolsSlice.reducer;
