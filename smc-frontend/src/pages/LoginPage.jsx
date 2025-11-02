import { useEffect } from "react";
import { getMicrosoftAuthUrl } from "../apis";

export function LoginPage() {
  useEffect(() => {
    // Redirect to Microsoft login
    window.location.href = getMicrosoftAuthUrl("smc");
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-lg font-semibold">Redirecting to login...</div>
    </div>
  );
}
