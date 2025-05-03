import { redis, supabase } from "@connections";
import { Redis } from "@upstash/redis";

class Auth {
  protected readonly redis: Redis;

  constructor() {
    this.redis = redis;
  }

  performOAuth = async (provider: "github" | "google", redirectTo: string) => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo,
        skipBrowserRedirect: true,
      },
    });
    if (error) throw error;
  };

  sendMagicLink = async (email: string, redirectTo: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectTo,
      },
    });

    if (error) throw error;
  };

  signUpNewUser = async (
    email: string,
    password: string,
    redirectTo: string
  ) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectTo,
      },
    });
    if (error) throw error;
    return { data };
  };

  signInWithEmail = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return { data };
  };

  sendResetPasswordEmail = async (email: string, redirectTo: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });
    if (error) throw error;
  };

  updatePassword = async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw error;
  };

  signOut = async (scope: "global" | "local" | "others") => {
    if (scope === "global") {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } else {
      const { error } = await supabase.auth.signOut({ scope });
      if (error) throw error;
    }
  };
}

export default Auth;
