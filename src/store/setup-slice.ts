import { createSlice, PayloadAction } from "@reduxjs/toolkit";

const initialState = { colPointsObjs: [], PhoneCollectionPoint: "", PhoneCP_Office: "", PhoneCollectionPointLabel: "",PhoneCP_Type:"" };

const setupSlice = createSlice({
  name: "setup",
  initialState: initialState,
  reducers: {
    addCollectionPoints: (state, action: PayloadAction) => {
      state.colPointsObjs = action.payload.colPointsObjs;
    },
    updatePhone: (state, action: PayloadAction<string>) => {
      state.PhoneCollectionPoint = action.payload;
    },
    updatePhoneCP_Office: (state, action: PayloadAction<string>) => {
      state.PhoneCP_Office = action.payload;
    },
    updatePhoneCollectionPointLabel: (state, action: PayloadAction<string>) => {
      state.PhoneCollectionPointLabel = action.payload;
    },
    updatePhoneCPType: (state, action: PayloadAction<string>) => {
      state.PhoneCP_Type = action.payload;
    },
  },
});

export const setupActions = setupSlice.actions;
export default setupSlice.reducer;

