import { requireAuth } from "@/lib/auth-guard"

export default async function TodoLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  await requireAuth()

  return children
}