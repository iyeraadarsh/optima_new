import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Link from "next/link";
import { Mail, Lock, User, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { systemConfigService } from "@/services/systemConfigService";

export default function RegisterPage() {
  const router = useRouter();
  const { register, userProfile } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [superAdminExists, setSuperAdminExists] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);

  useEffect(() => {
    // Check if a super admin already exists
    const checkSuperAdmin = async () => {
      try {
        setCheckingAdmin(true);
        const exists = await systemConfigService.checkSuperAdminExists();
        setSuperAdminExists(exists);
        
        // If super admin exists and current user is not an admin, redirect to login
        if (exists && (!userProfile || (userProfile.role !== 'super_admin' && userProfile.role !== 'admin'))) {
          router.push('/auth/login');
        }
      } catch (error) {
        console.error('Error checking super admin:', error);
        // Default to true in case of error to prevent unauthorized registrations
        setSuperAdminExists(true);
      } finally {
        setCheckingAdmin(false);
      }
    };
    
    checkSuperAdmin();
  }, [router, userProfile]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    setLoading(true);

    try {
      console.log("Starting registration with:", { name, email });
      
      // Create user with Firebase Auth and add to Firestore using the context method
      await register(email, password, {
        name,
        email,
        role: "user", // Default role for new registrations
        status: "active" // Explicitly set status
      });
      
      console.log("Registration successful, redirecting to dashboard");
      
      // Redirect to dashboard after successful registration
      router.push("/dashboard");
    } catch (error: any) {
      console.error("Registration error in component:", error);
      
      // More detailed error handling
      if (error.code === "auth/email-already-in-use") {
        setError("Email is already in use. Please use a different email or login.");
      } else if (error.code === "auth/weak-password") {
        setError("Password is too weak. Please use a stronger password.");
      } else if (error.code === "auth/invalid-email") {
        setError("Invalid email address format.");
      } else if (error.code === "auth/network-request-failed") {
        setError("Network error. Please check your internet connection and try again.");
      } else if (error.message && error.message.includes("permission")) {
        setError("Registration failed: Permission error. Please try again later.");
      } else {
        setError(`Registration failed: ${error.message || "Please try again."}`);
      }
    } finally {
      setLoading(false);
    }
  };

  // If checking admin status, show loading
  if (checkingAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Register | Enterprise Management System</title>
      </Head>

      <div className="flex items-center justify-center min-h-[80vh] px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">Create an account</CardTitle>
            <CardDescription>
              Enter your information to create an account
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleRegister}>
            <CardContent className="space-y-4">
              {error && (
                <div className="p-3 text-sm bg-red-50 text-red-600 rounded-md">
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="John Doe"
                    className="pl-10"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    className="pl-10"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    className="pl-10 pr-10"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-slate-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-slate-400" />
                    )}
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    id="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    className="pl-10"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Creating account..." : "Register"}
              </Button>
              <div className="text-center text-sm">
                Already have an account?{" "}
                <Link
                  href="/auth/login"
                  className="text-blue-600 hover:text-blue-800"
                >
                  Login
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </>
  );
}