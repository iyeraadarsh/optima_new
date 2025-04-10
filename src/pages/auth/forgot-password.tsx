import React, { useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Link from "next/link";
import { Mail, AlertCircle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { authService } from "@/services/authService";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setLoading(true);

    try {
      console.log(`Attempting to send password reset email to: ${email}`);
      
      // Check if user exists first
      const userExists = await authService.checkUserExists(email);
      if (!userExists) {
        console.log(`User with email ${email} not found in database`);
        // Still proceed with reset to avoid leaking user information
        // But log for debugging purposes
      }
      
      await authService.resetPassword(email);
      console.log(`Password reset email sent successfully to: ${email}`);
      setSuccess(true);
    } catch (error: any) {
      console.error("Reset password error:", error);
      
      if (error.code === "auth/user-not-found") {
        // Don't reveal if user exists or not for security reasons
        setSuccess(true); // Still show success to prevent user enumeration
        console.log("User not found, but showing success message for security");
      } else if (error.code === "auth/invalid-email") {
        setError("Invalid email address format.");
      } else if (error.code === "auth/network-request-failed") {
        setError("Network error. Please check your internet connection and try again.");
      } else {
        setError(`Unable to send password reset email: ${error.message || "Please try again."}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Forgot Password | Enterprise Management System</title>
      </Head>

      <div className="flex items-center justify-center min-h-[80vh] px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">Reset your password</CardTitle>
            <CardDescription>
              Enter your email address and we'll send you a link to reset your password
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleResetPassword}>
            <CardContent className="space-y-4">
              {error && (
                <div className="p-3 text-sm bg-red-50 text-red-600 rounded-md">
                  {error}
                </div>
              )}
              {success && (
                <div className="p-3 text-sm bg-green-50 text-green-600 rounded-md">
                  Password reset link sent to your email address. Please check your inbox.
                </div>
              )}
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
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Sending reset link..." : "Send reset link"}
              </Button>
              <div className="text-center text-sm">
                Remember your password?{" "}
                <Link
                  href="/auth/login"
                  className="text-blue-600 hover:text-blue-800"
                >
                  Back to login
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </>
  );
}