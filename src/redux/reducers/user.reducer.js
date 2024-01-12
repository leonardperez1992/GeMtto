/* eslint-disable import/no-anonymous-default-export */
import { SAVE_USER, UPDATE_USER_NAME } from "../../constants";

const initialState = null;

export default (state = initialState, { type, payload }) => {
  switch (type) {
    case SAVE_USER:
      return payload;
    case UPDATE_USER_NAME:
      return {...state, name: payload }
    default:
      return state;
  }
};
