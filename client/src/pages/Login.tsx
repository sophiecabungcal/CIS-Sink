import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import sinkLogo from "@assets/Sink_logo_final_1769857258425.png";

export default function Login() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  useEffect(() => {
    document.body.style.backgroundColor = '#BE5B50';
    return () => {
      document.body.style.backgroundColor = '';
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden bg-[#BE5B50]">
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-20 -mt-20" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -ml-20 -mb-20" />

      <div className="relative z-10 w-full max-w-sm text-center space-y-8">
        <div className="flex justify-center mb-6">
          <div className="bg-[#FBDB93] rounded-3xl px-8 py-6">
            <img 
              src={sinkLogo} 
              alt="Sink" 
              className="h-24 w-auto"
              data-testid="img-login-logo"
            />
          </div>
        </div>

        <div className="pt-8">
          <Button 
            size="lg" 
            className="w-full text-lg rounded-xl shadow-lg bg-[#FBDB93] text-[#641B2E] border-0 hover:bg-[#e9c97d] active:bg-[#d4b56b]"
            onClick={handleLogin}
            data-testid="button-login"
          >
            Get Started
          </Button>
        </div>
      </div>
    </div>
  );
}
