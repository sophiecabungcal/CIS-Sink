import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, User } from "lucide-react";
import sinkLogo from "@assets/Sink_logo_final_1769857258425.png";

interface AppHeaderProps {
  title: string;
  subtitle?: string;
  rightContent?: React.ReactNode;
  className?: string;
}

export function AppHeader({ title, subtitle, rightContent, className = "" }: AppHeaderProps) {
  const { user, logout } = useAuth();

  const getInitials = () => {
    if (!user) return "U";
    if (user.firstName && user.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    if (user.firstName) return user.firstName[0].toUpperCase();
    return "U";
  };

  return (
    <header className={`sticky top-0 z-10 bg-[#E8C67E]/95 backdrop-blur-md border-b border-[#D4B46B]/50 px-6 py-4 ${className}`}>
      <div className="flex items-center justify-between mb-4 gap-2">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground" data-testid="text-page-title">{title}</h1>
          {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-3">
          <img 
            src={sinkLogo} 
            alt="Sink" 
            className="h-8 w-auto" 
            data-testid="img-app-logo"
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button 
                className="focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-full"
                data-testid="button-profile-menu"
              >
                <Avatar className="cursor-pointer">
                  <AvatarImage src={user?.profileImageUrl || undefined} alt={user?.firstName || "User"} />
                  <AvatarFallback className="bg-primary/10 text-primary font-bold">
                    {getInitials()}
                  </AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem disabled className="opacity-60" data-testid="menu-item-edit-profile">
                <User size={16} className="mr-2" />
                Edit Profile
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => logout()}
                className="text-destructive focus:text-destructive"
                data-testid="menu-item-logout"
              >
                <LogOut size={16} className="mr-2" />
                Log Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      {rightContent}
    </header>
  );
}
