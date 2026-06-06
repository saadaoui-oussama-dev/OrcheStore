import { counter } from "./counter";
import { configureStore } from "@reduxjs/toolkit";

export { Provider as StoreProvider } from "react-redux";

export const store = configureStore({
  reducer: {
    counter: counter.reducer,
  },
});
