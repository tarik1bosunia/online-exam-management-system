import React, { useState } from 'react'

import { useAppSelector, useAppDispatch } from '@/lib/redux/hooks'

import { decrement, increment } from './counterSlice'

export default function Counter() {
  // The `state` arg is correctly typed as `RootState` already
  const count = useAppSelector((state) => state.counter.value)
  const dispatch = useAppDispatch()

  // omit rendering logic
  return (
    <div className="p-4 bg-white rounded-lg shadow-md max-w-sm mx-auto my-8">
      <h2 className="text-2xl font-bold mb-4 text-center">Counter</h2>
      <div className="flex items-center justify-center space-x-4">
        <button
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          onClick={() => dispatch(decrement())}
        >
          -
        </button>
        <span className="text-xl font-semibold">{count}</span>
        <button
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          onClick={() => dispatch(increment())}
        >
          +
        </button>
      </div>
    </div>
  )
}