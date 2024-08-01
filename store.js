import devToolsEnhancer from "redux-devtools-expo-dev-plugin";
import { createSlice, combineSlices, configureStore } from "@reduxjs/toolkit";
import AsyncStorage from "@react-native-async-storage/async-storage";
import _ from "lodash";

export const appSlice = createSlice({
  name: "app",
  initialState: {
    lang: "en",
    themeMood: "dark",
    plans: [],
    routines: [],
  },
  reducers: {
    changeLang: (state) => {
      const newLang = state.lang === "en" ? "fa" : "en";
      state.lang = newLang;
    },

    changeThemeMood: (state) => {
      const newThemeMood = state.themeMood === "dark" ? "light" : "dark";
      state.themeMood = newThemeMood;
    },

    updatePlans: (state, action) => {
      state.plans = action.payload;
    },

    updateRoutines: (state, action) => {
      state.routines = action.payload;
    },

    addPlan: (state, action) => {
      const { payload } = action;

      state.plans.push(payload);
    },

    addRoutine: (state, action) => {
      const { payload } = action;

      const concat = _.concat(state.routines, payload);
      state.routines = concat;
    },

    deletePlan: (state, action) => {
      const { payload } = action;

      const newArray = _.filter(
        state.plans,
        (item) => item.id != payload && item
      );
      state.plans = newArray;
    },

    deleteRoutine: (state, action) => {
      const { payload } = action;
      const newArray = _.filter(
        state.routines,
        (item) => item.id != payload && item
      );
      state.routines = newArray;
    },
    checkedPlanOrRoutine: (state, action) => {
      const { payload } = action;
      if (payload.type == "plans") {
        state.plans = payload.data;
      } else if (payload.type == "routine") {
        state.routines = payload.data;
      }
    },
  },
});

const reducer = combineSlices(appSlice);

export const store = configureStore({
  reducer,
  devTools: false,
  enhancers: (getDefaultEnhancers) =>
    getDefaultEnhancers().concat(devToolsEnhancer()),
});

export const {
  changeLang,
  changeThemeMood,
  updatePlans,
  updateRoutines,
  addPlan,
  addRoutine,
  deletePlan,
  deleteRoutine,
  checkedPlanOrRoutine,
} = appSlice.actions;
