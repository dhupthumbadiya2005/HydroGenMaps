import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { LoginForm } from './LoginForm';
import { SignupForm } from './SignupForm';
import { ForgotPasswordForm } from './ForgotPasswordForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

type AuthMode = 'login' | 'signup' | 'forgot-password';

export const AuthHandler: React.FC = () => {
  const { user, loading } = useAuth();
  const [mode, setMode] = useState<AuthMode>('login');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/explore" replace />;
  }

  if (mode === 'forgot-password') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-md space-y-4">
          <Button 
            variant="ghost" 
            onClick={() => setMode('login')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Login
          </Button>
          <Card className="shadow-lg">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                Reset Password
              </CardTitle>
              <CardDescription>
                Enter your email to receive a password reset link
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ForgotPasswordForm onSuccess={() => setMode('login')} />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo/Brand */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold bg-gradient-hero bg-clip-text text-transparent">
            HydroGenMaps
          </h1>
          <p className="text-muted-foreground">
            Hydrogen Site Analysis Platform
          </p>
        </div>

        <Card className="shadow-lg">
          <CardContent className="p-6">
            <Tabs value={mode} onValueChange={(value) => setMode(value as AuthMode)}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login" className="space-y-4">
                <div className="text-center space-y-2">
                  <CardTitle>Welcome Back</CardTitle>
                  <CardDescription>
                    Sign in to your HydroGenMaps account
                  </CardDescription>
                </div>
                <LoginForm onForgotPassword={() => setMode('forgot-password')} />
              </TabsContent>
              
              <TabsContent value="signup" className="space-y-4">
                <div className="text-center space-y-2">
                  <CardTitle>Create Account</CardTitle>
                  <CardDescription>
                    Join HydroGenMaps to start analyzing hydrogen sites
                  </CardDescription>
                </div>
                <SignupForm />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};