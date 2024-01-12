/* eslint-disable import/no-anonymous-default-export */
import { SAVE_SERVICES, UPDATE_SERVICES } from "../../constants";

const initialState = [];

export default (state = initialState, { type, payload }) => {
  switch (type) {
    case SAVE_SERVICES:
      return payload;
    case UPDATE_SERVICES:
        return [...state, ...payload]
    default:
      return state;
  }
};

