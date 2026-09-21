import axios from 'axios';
import { store } from '../../store/store';
import Logger from "../Logger";

const createApiInstance =  (endpoint:string) => {
  Logger.debug("creating API client to "+endpoint);

  const api = axios.create({
    baseURL: endpoint,
  });
   // Set the default Authorization header using the token from the Redux store
  api.defaults.headers.common['Authorization'] = `Bearer ${store.getState().user.token}`;
  api.defaults.headers.common['Content-Type'] = 'application/json';

  return api;
};

export default createApiInstance;

