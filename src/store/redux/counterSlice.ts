// src/store/redux/counterSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface CounterState {
    value: number;
}

const initialState: CounterState = { value: 0 };

const counterSlice = createSlice({
    name: 'counter',
    initialState,
    reducers: {
        // Viết như đang "mutate" trực tiếp state.value — RTK dùng Immer lo phần Immutability
        increment: (state) => {
            state.value += 1;
        },
        decrement: (state) => {
            state.value -= 1;
        },
        incrementByAmount: (state, action: PayloadAction<number>) => {
            state.value += action.payload;
        },
    },
});

// RTK TỰ ĐỘNG sinh ra các Action Creators — không cần viết tay actionTypes/actions nữa!
export const { increment, decrement, incrementByAmount } = counterSlice.actions;
export default counterSlice.reducer;