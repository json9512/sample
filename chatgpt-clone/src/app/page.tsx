"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseClient } from "@/lib/supabase/client";
import Loading from "@/components/ui/Loading";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const checkAuthAndRedirect = async () => {
      try {
        const supabase = createSupabaseClient();
        
        // Handle the auth callback from URL hash/params
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Session error:', error);
          router.push("/login");
          return;
        }

        if (data.session?.user) {
          console.log('User authenticated:', data.session.user.email);
          router.push("/dashboard");
        } else {
          console.log('No active session');
          router.push("/login");
        }
      } catch (e) {
        console.log('Auth check error:', e);
        router.push("/login");
      }
    };

    console.log("checkAuthAndRedirect");
    checkAuthAndRedirect();
    
    // Also listen for auth state changes
    const supabase = createSupabaseClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state change:', event, session?.user?.email);
      
      if (event === 'SIGNED_IN' && session) {
        console.log('User signed in, redirecting to dashboard');
        router.push("/dashboard");
      } else if (event === 'SIGNED_OUT' || !session) {
        console.log('User signed out, redirecting to login');
        router.push("/login");
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Loading size="lg" text="Redirecting..." centered />
    </div>
  );
}
