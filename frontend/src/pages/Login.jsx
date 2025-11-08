import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

const API_BASE_URL = 'http://localhost:3000/api';

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      // Store token and user
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      // Update auth context
      login(data.user, data.token);
      
      // Navigate based on role from API response
      if (data.user.role === "teacher") {
        navigate("/teacher/dashboard");
      } else {
        navigate("/student/dashboard");
      }
    } catch (err) {
      setError(err.message || 'An error occurred during login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-100 relative overflow-hidden">
      {/* Floating background shapes */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-blue-200/30 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-0 right-0 w-72 h-72 bg-indigo-200/30 rounded-full blur-2xl animate-pulse delay-700" />

      <div className="flex flex-col md:flex-row items-center justify-center max-w-6xl w-full p-8 md:p-12 relative z-10">
        {/* Left Section */}
        <div className="md:w-1/2 space-y-8 text-left px-4 md:px-8 animate-fadeInUp">
          <h1 className="text-5xl md:text-6xl font-extrabold leading-tight">
            <span className="text-gray-800 block">Welcome to</span>
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent animate-text-shimmer">
              CODEMIA
            </span>
            <span className="text-blue-600">!</span>
          </h1>
          <p className="text-lg text-gray-600 font-medium tracking-wide">
            <span className="text-blue-600 font-semibold">Smart</span> coding evaluations for the next generation of developers.
          </p>

          {/* Login Form */}
          <form
            onSubmit={handleSubmit}
            className="space-y-5 max-w-sm bg-white/80 backdrop-blur-xl p-6 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300"
          >
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-700 font-medium">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-white border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-700 font-medium">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-white border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:opacity-95 hover:scale-[1.02] text-white font-semibold py-2 rounded-lg shadow-md transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin inline" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </Button>

            <p className="text-xs text-gray-500 text-center pt-1 italic">
              Let's get you coding
            </p>
          </form>

          <div className="text-sm text-gray-500 space-y-1 pt-2">
            <p>
              Can't login?{" "}
              <a href="#" className="text-blue-600 hover:underline font-medium">
                Contact us
              </a>
            </p>
          </div>
        </div>

        {/* Right Section (Image / Illustration) */}
        <div className="md:w-1/2 flex justify-center mt-12 md:mt-0 relative animate-fadeInSlow">
          <div className="relative group">
            <img
              src="/loginimg.png"
              alt="Languages"
              className="max-w-md w-full drop-shadow-2xl transform transition-transform duration-1000 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-blue-200/20 to-transparent blur-3xl rounded-3xl opacity-60 animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
