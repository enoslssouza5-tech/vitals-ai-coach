import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Activity } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    (async () => {
      if (!user) { navigate({ to: "/login" }); return; }
      const { data } = await supabase.from("profiles").select("onboarded").eq("id", user.id).maybeSingle();
      navigate({ to: data?.onboarded ? "/dashboard" : "/onboarding" });
    })();
  }, [user, loading, navigate]);

  return (
    <div className="min-h-screen grid place-items-center">
      <div className="flex flex-col items-center gap-4">
        <div className="pulse-ring h-14 w-14 rounded-full bg-primary grid place-items-center glow-primary">
          <Activity className="h-7 w-7 text-primary-foreground" />
        </div>
        <span className="text-sm text-muted-foreground">Pulse</span>
      </div>
    </div>
  );
}
