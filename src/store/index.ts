import {
	combineReducers,
	configureStore,
	type UnknownAction,
} from "@reduxjs/toolkit";
import {
	persistReducer,
	FLUSH,
	REHYDRATE,
	PAUSE,
	PERSIST,
	PURGE,
	REGISTER,
	type PersistConfig,
} from "redux-persist";
import storage from "redux-persist/lib/storage";
import autoMergeLevel2 from "redux-persist/lib/stateReconciler/autoMergeLevel2";

import authReducer from "./slices/authSlice";
import uiReducer from "./slices/uiSlice";
import expenseReducer from "./slices/expenseSlice";
import categoryReducer from "./slices/categorySlice";
import bucketReducer from "./slices/bucketSlice";
import filtersReducer from "./slices/filtersSlice";

const rootReducer = combineReducers({
	auth: authReducer,
	ui: uiReducer,
	expenses: expenseReducer,
	categories: categoryReducer,
	buckets: bucketReducer,
	filters: filtersReducer,
});

type RootReducerState = ReturnType<typeof rootReducer>;

const persistConfig: PersistConfig<RootReducerState> = {
	key: "root",
	storage,
	stateReconciler:
		autoMergeLevel2 as PersistConfig<RootReducerState>["stateReconciler"],
	whitelist: [
		"auth",
		"ui",
		"expenses",
		"categories",
		"filters",
		"buckets",
	],
};

const persistedReducer = persistReducer<
	RootReducerState,
	UnknownAction
>(persistConfig, rootReducer);

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
