"use client";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogOut, User, Mail, Shield } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function UserCard({ user }: { user: any }) {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await authClient.signOut({
        fetchOptions: {
            onSuccess: () => {
                router.push("/login");
            }
        }
    });
    setIsLoggingOut(false);
  };

  return (
    <Card className="w-full max-w-md shadow-2xl border-zinc-200/50 bg-white/80 backdrop-blur-xl">
      <CardHeader className="text-center pb-2">
        <div className="flex justify-center mb-4">
          <Avatar className="h-24 w-24 border-4 border-primary/10 shadow-xl">
            <AvatarImage src={user.image} alt={user.name} />
            <AvatarFallback className="bg-primary/5 text-primary text-2xl">
              {user.name?.charAt(0) || "U"}
            </AvatarFallback>
          </Avatar>
        </div>
        <CardTitle className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-zinc-900 to-zinc-600">
          {user.name}
        </CardTitle>
        <CardDescription className="flex items-center justify-center gap-1.5 mt-1">
          <Shield className="h-3.5 w-3.5 text-primary" />
          Authenticated User
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 pt-4">
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-zinc-50 border border-zinc-100">
            <Mail className="h-4 w-4 text-zinc-400" />
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold">Email Address</span>
              <span className="text-sm font-medium text-zinc-700">{user.email}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-3 rounded-lg bg-zinc-50 border border-zinc-100">
            <User className="h-4 w-4 text-zinc-400" />
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold">User ID</span>
              <span className="text-[10px] font-mono text-zinc-500 break-all">{user.id}</span>
            </div>
          </div>
        </div>

        <Button 
          variant="destructive" 
          className="w-full h-11 font-semibold shadow-lg shadow-red-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]" 
          onClick={handleLogout}
          disabled={isLoggingOut}
        >
          <LogOut className="mr-2 h-4 w-4" />
          {isLoggingOut ? "Signing out..." : "Sign Out"}
        </Button>
      </CardContent>
    </Card>
  );
}