import { configureStore } from '@reduxjs/toolkit';
import formsReducer from './form-slice';
import listReducer from './listSlice';
import userReducer from './user-slice';
import setupReducer from './setup-slice'
export const store = configureStore({
    reducer: {
        stateForms: formsReducer,
        stateList: listReducer,
        user: userReducer,
        setup: setupReducer
    }
});
