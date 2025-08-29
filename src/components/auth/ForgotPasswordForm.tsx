import React, { useState } from 'react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/firebase/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Mail, Check } from 'lucide-react';

interface ForgotPasswordFormProps {
  onSuccess: () => void;
}

export const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({ onSuccess }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setSent(true);
      toast({
        title: "Reset email sent!",
        description: "Check your email for password reset instructions.",
      });
    } catch (error: any) {
      toast({
        title: "Failed to send reset email",
        description: error.message || "Please check your email and try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="text-center space-y-4">
        <div className="w-12 h-12 bg-success/10 rounded-full flex items-center justify-center mx-auto">
          <Check className="w-6 h-6 text-success" />
        </div>
        <div className="space-y-2">
          <h3 className="font-semibold">Email sent!</h3>
          <p className="text-sm text-muted-foreground">
            We've sent a password reset link to <strong>{email}</strong>
          </p>
        </div>
        <Button onClick={onSuccess} className="w-full">
          Back to Login
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="reset-email">Email Address</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            id="reset-email"
            type="email"
            placeholder="Enter your email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="pl-10"
            required
          />
        </div>
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={loading || !email}
      >
        {loading ? 'Sending...' : 'Send Reset Link'}
      </Button>

      <p className="text-xs text-muted-foreground text-center">
        You'll receive an email with instructions to reset your password.
      </p>
    </form>
  );
};