// create slice

import { createSlice } from "@reduxjs/toolkit";
import { updateUserPhoto } from "./userPhotoApiSlice";

const userPhotoSlice = createSlice({
  name: "userPhoto",
  initialState: {
    userPhoto: null,
    photomessage: null,
    photoerror: null,
    loader: false,
  },
  reducers: {
    setPhotoEmptyMessage : (state) =>{
      state.photomessage = null,
      state.photoerror = null
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(updateUserPhoto.pending, (state) => {
        state.loader = true;
      })
      .addCase(updateUserPhoto.fulfilled, (state, action) => {
        state.loader = false;
        state.userPhoto = action.payload.userPhoto;
        state.photomessage = action.payload.message
      })
      .addCase(updateUserPhoto.rejected, (state, action) => {
        state.loader = false;
        state.photoerror = action.error.message;
      })
      ;
  },
});



//selector export

export const userPhotoSelector = (state) => state.userPhoto;

//actions export

export const {setPhotoEmptyMessage} = userPhotoSlice.actions;

//reducer export

export default userPhotoSlice.reducer;

