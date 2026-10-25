"use client";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogOut, User, Mail, Shield } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export interface UserCardProfile {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

export function UserCard({ user }: { user: UserCardProfile }) {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push("/login");
        },
      },
    });
    setIsLoggingOut(false);
  };

  return (
    <Card className="w-full max-w-md shadow-2xl border-border bg-card/80 backdrop-blur-xl">
      <CardHeader className="text-center pb-2">
        <div className="flex justify-center mb-4">
          <Avatar className="h-24 w-24 border-4 border-primary/10 shadow-xl">
            {user.image && <AvatarImage src={user.image} alt={user.name || "User"} />}
            <AvatarFallback className="bg-primary/5 text-primary text-2xl font-bold">
              {user.name?.charAt(0) || "U"}
            </AvatarFallback>
          </Avatar>
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight text-foreground">
          {user.name || "Workspace User"}
        </CardTitle>
        <CardDescription className="flex items-center justify-center gap-1.5 mt-1 text-muted-foreground">
          <Shield className="h-3.5 w-3.5 text-primary" />
          Authenticated User
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 pt-4">
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/40 border border-border">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Email Address</span>
              <span className="text-sm font-medium text-foreground">{user.email || "No email"}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/40 border border-border">
            <User className="h-4 w-4 text-muted-foreground" />
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">User ID</span>
              <span className="text-[10px] font-mono text-muted-foreground break-all">{user.id}</span>
            </div>
          </div>
        </div>

        <Button 
          variant="destructive" 
          className="w-full h-11 font-semibold transition-all hover:opacity-90 cursor-pointer" 
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
