// create slice

import { createSlice } from "@reduxjs/toolkit";
import {
  createAlert,
  editAlert,
  // createIncoming,
  // editIncomings,
  getAllAlert,
  updateIncidenceDeclaration,
  updateInvestigationAlert,
} from "./alertApiSlice";

const initialState = {
  alert: [],
  alertMessage: null,
  alertError: null,
  alertLoader: false,
};

const alertSlice = createSlice({
  name: "alert",
  initialState,
  reducers: {
    setEmptyAlertMessage: (state) => {
      (state.alertMessage = null), (state.alertError = null);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createAlert.pending, (state) => {
        state.alertLoader = true;
      })
      .addCase(createAlert.fulfilled, (state, action) => {
        state.alertLoader = false;
        state.alert = [...state.alert, action.payload.alert];
        state.alertMessage = action.payload.message;
      })
      .addCase(createAlert.rejected, (state, action) => {
        state.alertLoader = false;
        state.alertError = action.error.message;
      })
      // get All Alert
      .addCase(getAllAlert.pending, (state) => {
        state.alertLoader = true;
      })
      .addCase(getAllAlert.fulfilled, (state, action) => {
        state.alertLoader = false;
        state.alert = action.payload.data.alerts;
        state.totalAlerts = action.payload.data.pagination.totalAlerts;
        
        // ✅ Save the counts from backend
        state.alertCounts = action.payload.data.counts; 
        state.userWiseAlerts = action.payload.data.userWiseStats;
      })
      .addCase(getAllAlert.rejected, (state, action) => {
        state.alertLoader = false;
        state.alertError = action.error.message;
      })

      // Update Alert
      .addCase(editAlert.pending, (state) => {
        state.alertLoader = true;
      })
      .addCase(editAlert.fulfilled, (state, action) => {
    state.alertLoader = false;
    const updated = action.payload.alert;
    
    // ✅ FIX: Check if state.alert is actually an array before mapping
    if (Array.isArray(state.alert)) {
        state.alert = state.alert.map((a) =>
          a._id === updated._id ? updated : a
        );
    }
    
    // If you are using server-side pagination, you might not even need to update 
    // the list in Redux, because the list lives in your Component now.
    
    // state.alertMessage = "Alert updated successfully"; 
})
      .addCase(editAlert.rejected, (state, action) => {
        state.alertLoader = false;
        state.alertError = action.error.message;
      })
      // Update Investigation Alert
      .addCase(updateInvestigationAlert.pending, (state) => {
        state.alertLoader = true;
      })
      .addCase(updateInvestigationAlert.fulfilled, (state, action) => {
        state.alertLoader = false;
        const updated = action.payload.alert;
        state.alert = state.alert.map((a) =>
          a._id === updated._id ? updated : a
        );
        state.alertMessage = action.payload.message;
      })
      .addCase(updateInvestigationAlert.rejected, (state, action) => {
        state.alertLoader = false;
        state.alertError = action.error.message;
      })

      // Update indicence declaration
      .addCase(updateIncidenceDeclaration.pending, (state) => {
        state.alertLoader = true;
      })
      .addCase(updateIncidenceDeclaration.fulfilled, (state, action) => {
        state.alertLoader = false;
        const updated = action.payload.alert;
        state.alert = state.alert.map((a) =>
          a._id === updated._id ? updated : a
        );
        state.alertMessage = action.payload.message;
      })
      .addCase(updateIncidenceDeclaration.rejected, (state, action) => {
        state.alertLoader = false;
        state.alertError = action.error.message;
      });
  },
});

//selector export

export const alertSelector = (state) => state.alert;

//actions export

export const { setEmptyAlertMessage } = alertSlice.actions;

//reducer export

export default alertSlice.reducer;


// import { createSlice } from "@reduxjs/toolkit";
// import {
//   createAlert,
//   editAlert,
//   getAllAlert,
//   updateIncidenceDeclaration,
//   updateInvestigationAlert,
// } from "./alertApiSlice";

// const initialState = {
//   alert: [],
//   alertMessage: null,
//   alertError: null,
//   alertLoader: false,
// };

// const alertSlice = createSlice({
//   name: "alert",
//   initialState,
//   reducers: {
//     setEmptyAlertMessage: (state) => {
//       state.alertMessage = null;
//       state.alertError = null;
//     },
//   },
//   extraReducers: (builder) => {
//     builder
//       // --- Create Alert ---
//       .addCase(createAlert.pending, (state) => {
//         state.alertLoader = true;
//       })
//       .addCase(createAlert.fulfilled, (state, action) => {
//         state.alertLoader = false;
//         state.alert = [...state.alert, action.payload.alert];
//         state.alertMessage = action.payload.message;
//       })
//       .addCase(createAlert.rejected, (state, action) => {
//         state.alertLoader = false;
//         state.alertError = action.error.message;
//       })

//       .addCase(getAllAlert.fulfilled, (state, action) => {
//         state.alertLoader = false;
        
//         // 🛡️ CRASH FIX: Check all possible locations for the data
//         const payload = action.payload;
        
//         // Try to find alerts in payload.data.alerts OR payload.alerts
//         const alerts = payload?.data?.alerts || payload?.alerts || [];
        
//         state.alert = alerts; 
//       })

//       // --- Edit Alert ---
//       .addCase(editAlert.pending, (state) => {
//         state.alertLoader = true;
//       })
//       .addCase(editAlert.fulfilled, (state, action) => {
//         state.alertLoader = false;
//         const updated = action.payload.alert;
        
//         if (Array.isArray(state.alert)) {
//           state.alert = state.alert.map((a) =>
//             a._id === updated._id ? updated : a
//           );
//         }
//       })
//       .addCase(editAlert.rejected, (state, action) => {
//         state.alertLoader = false;
//         state.alertError = action.error.message;
//       })

//       // --- Update Investigation ---
//       .addCase(updateInvestigationAlert.pending, (state) => {
//         state.alertLoader = true;
//       })
//       .addCase(updateInvestigationAlert.fulfilled, (state, action) => {
//         state.alertLoader = false;
//         const updated = action.payload.alert;
        
//         // ✅ Safety Check added here too
//         if (Array.isArray(state.alert)) {
//           state.alert = state.alert.map((a) =>
//             a._id === updated._id ? updated : a
//           );
//         } else {
//              state.alert = [updated]; 
//         }
//         state.alertMessage = action.payload.message;
//       })
//       .addCase(updateInvestigationAlert.rejected, (state, action) => {
//         state.alertLoader = false;
//         state.alertError = action.error.message;
//       })

//       // --- Update Incidence Declaration ---
//       .addCase(updateIncidenceDeclaration.pending, (state) => {
//         state.alertLoader = true;
//       })
//       .addCase(updateIncidenceDeclaration.fulfilled, (state, action) => {
//         state.alertLoader = false;
//         const updated = action.payload.alert;

//         if (Array.isArray(state.alert)) {
//             state.alert = state.alert.map((a) =>
//               a._id === updated._id ? updated : a
//             );
//         }
//         state.alertMessage = action.payload.message;
//       })
//       .addCase(updateIncidenceDeclaration.rejected, (state, action) => {
//         state.alertLoader = false;
//         state.alertError = action.error.message;
//       });
//   },
// });

// export const alertSelector = (state) => state.alert;
// export const { setEmptyAlertMessage } = alertSlice.actions;
// export default alertSlice.reducer;
