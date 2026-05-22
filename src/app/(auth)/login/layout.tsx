import React from 'react'
import { requireUnAuth } from '../../../lib/auth-guard'

const AuthLayout = async ({children}:{children:React.ReactNode}) => {
  await requireUnAuth();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background-100">{children}</div>
  )
}

export default AuthLayout