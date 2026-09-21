import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import Logger from '../core/Logger';

const initialState : ListState  = {officeList : [],annexOfficeList:[],list:{}}

const listSlice = createSlice({
    name: 'list',
    initialState:initialState,
    reducers: {
        addOfficeList: (state,  action:PayloadAction<any[]>) => {
            state.officeList = action.payload;
        },
        addAnnexOfficeList: (state,  action:PayloadAction<any[]>) => {
            state.annexOfficeList = action.payload;
        },
        addList: (state,  action:PayloadAction<any[]>) => {
            state.list[action.payload.type] = action.payload.value;
        }
    }
});

export const listActions = listSlice.actions;
export default listSlice.reducer;
