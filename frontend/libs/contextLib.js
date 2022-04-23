import { useContext, createContext, useState } from "react";


export const AppContext = createContext()

export function ContextWrapper(props) {
  const { allContext, children } = props

  return (
    <AppContext.Provider value={allContext}>
      {children}
    </AppContext.Provider>
  )
}


export function useAppContext() {
  return useContext(AppContext)
}