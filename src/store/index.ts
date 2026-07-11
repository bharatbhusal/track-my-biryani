import {
	combineReducers,
	configureStore,
} from "@reduxjs/toolkit";
import {
	persistReducer,
	FLUSH,
	REHYDRATE,
	PAUSE,
	PERSIST,
	PURGE,
	REGISTER,
} from "redux-persist";
import storage from "redux-persist/lib/storage";

import authReducer from "./slices/authSlice";
import uiReducer from "./slices/uiSlice";
import expenseReducer from "./slices/expenseSlice";
import categoryReducer from "./slices/categorySlice";

const persistConfig = {
	key: "root",
	storage,
	whitelist: ["auth", "ui", "expenses", "categories"],
};

const rootReducer = combineReducers({
	auth: authReducer,
	ui: uiReducer,
	expenses: expenseReducer,
	categories: categoryReducer,
});

const persistedReducer = persistReducer(
	persistConfig,
	rootReducer,
);

export const makeStore = () =>
	configureStore({
		reducer: persistedReducer,
		middleware: (getDefaultMiddleware) =>
			getDefaultMiddleware({
				serializableCheck: {
					ignoredActions: [
						FLUSH,
						REHYDRATE,
						PAUSE,
						PERSIST,
						PURGE,
						REGISTER,
					],
				},
			}),
	});

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
