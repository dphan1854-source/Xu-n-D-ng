// src/store/redux/store.ts
import { configureStore } from '@reduxjs/toolkit';
import counterReducer from './redux/counterSlice';

export const store = configureStore({
    reducer: {
        counter: counterReducer, // Mỗi Slice là một "ngăn" riêng trong Store lớn
        // cartRedux: cartReducer,  <- sẽ thêm ở Sprint 6 khi làm bài tập bắt buộc
    },
});

// Tự suy ra Type cho useSelector/useDispatch — chuẩn TypeScript
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;