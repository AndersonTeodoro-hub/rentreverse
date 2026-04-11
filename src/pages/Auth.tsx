import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { Layout } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, Mail, Lock, User } from 'lucide-react';

const credentialsSchema = z.object({
  email: z.string().trim().email({ message: 'Email inválido' }),
  password: z.string().min(8, { message: 'A password deve ter pelo menos 8 caracteres' }),
});

const newPasswordSchema = z
  .object({
    password: z.string().min(8, { message: 'A password deve ter pelo menos 8 caracteres' }),
    confirm: z.string().min(1, { message: 'Confirme a password' }),
  })
  .refine((data) => data.password === data.confirm, {
    message: 'As passwords não coincidem',
    path: ['confirm'],
  });

export default function Auth() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [mode, setMode] = useState<'login' | 'signup'>(
    searchParams.get('mode') === 'signup' ? 'signup' : 'login'
  );
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Password recovery flow state
  const [recoveryMode, setRecoveryMode] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [newPasswordError, setNewPasswordError] = useState<string | null>(null);
  const [confirmNewPasswordError, setConfirmNewPasswordError] = useState<string | null>(null);
  const [recoveryLoading, setRecoveryLoading] = useState(false);

  useEffect(() => {
    const newMode = searchParams.get('mode') === 'signup' ? 'signup' : 'login';
    setMode(newMode);
  }, [searchParams]);

  // Detect Supabase password recovery callback. The provider redirects with a
  // hash fragment like #access_token=...&type=recovery&... The supabase-js
  // client auto-parses this and fires PASSWORD_RECOVERY via onAuthStateChange.
  useEffect(() => {
    const hash = window.location.hash;
    if (hash) {
      const params = new URLSearchParams(hash.startsWith('#') ? hash.slice(1) : hash);
      if (params.get('type') === 'recovery') {
        setRecoveryMode(true);
      }
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setRecoveryMode(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleRecoverySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNewPasswordError(null);
    setConfirmNewPasswordError(null);

    const parsed = newPasswordSchema.safeParse({
      password: newPassword,
      confirm: confirmNewPassword,
    });
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      setNewPasswordError(fieldErrors.password?.[0] ?? null);
      setConfirmNewPasswordError(fieldErrors.confirm?.[0] ?? null);
      return;
    }

    setRecoveryLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;

      toast({
        title: t('auth.success'),
        description: t('auth.passwordChanged', 'Password alterada com sucesso!'),
      });

      // Clear the recovery hash so a refresh doesn't re-trigger the flow
      window.history.replaceState(null, '', '/auth');
      setRecoveryMode(false);
      setNewPassword('');
      setConfirmNewPassword('');
      navigate('/dashboard');
    } catch (error: any) {
      toast({
        title: t('auth.error'),
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setRecoveryLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Inline validation with Zod (email format + min password length)
    setEmailError(null);
    setPasswordError(null);
    const parsed = credentialsSchema.safeParse({ email, password });
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      setEmailError(fieldErrors.email?.[0] ?? null);
      setPasswordError(fieldErrors.password?.[0] ?? null);
      return;
    }

    setLoading(true);

    try {
      if (mode === 'signup') {
        if (password !== confirmPassword) {
          toast({
            title: t('auth.error'),
            description: t('auth.passwordMismatch'),
            variant: 'destructive',
          });
          setLoading(false);
          return;
        }

        const { error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) throw error;

        toast({
          title: t('auth.success'),
          description: t('auth.signupSuccess'),
        });
        
        // Navigate to onboarding to select role
        navigate('/onboarding');
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        toast({
          title: t('auth.success'),
          description: t('auth.loginSuccess'),
        });
        
        navigate('/dashboard');
      }
    } catch (error: any) {
      toast({
        title: t('auth.error'),
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      toast({
        title: t('auth.error'),
        description: t('auth.forgotPasswordEmptyEmail', 'Preencha o email primeiro.'),
        variant: 'destructive',
      });
      return;
    }
    const emailCheck = z.string().email().safeParse(trimmedEmail);
    if (!emailCheck.success) {
      setEmailError('Email inválido');
      return;
    }
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(trimmedEmail, {
        redirectTo: `${window.location.origin}/auth`,
      });
      if (error) throw error;
      toast({
        title: t('auth.success'),
        description: t(
          'auth.forgotPasswordSent',
          'Email de recuperação enviado! Verifique a sua caixa de entrada.'
        ),
      });
    } catch (error: any) {
      toast({
        title: t('auth.error'),
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/onboarding`,
        },
      });

      if (error) throw error;
    } catch (error: any) {
      toast({
        title: t('auth.error'),
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  return (
    <Layout showFooter={false}>
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <img src="/logo_RentReverse.png" alt="RentReverse" className="h-12 w-12 rounded-xl" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">
              {recoveryMode
                ? t('auth.recoveryTitle', 'Definir nova password')
                : mode === 'login'
                  ? t('auth.loginTitle')
                  : t('auth.signupTitle')}
            </h1>
            <p className="text-muted-foreground mt-2">
              {recoveryMode
                ? t('auth.recoverySubtitle', 'Escolha uma nova password para a sua conta.')
                : mode === 'login'
                  ? t('auth.loginSubtitle')
                  : t('auth.signupSubtitle')}
            </p>
          </div>

          {/* Form */}
          <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
            {recoveryMode ? (
              <form onSubmit={handleRecoverySubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">{t('auth.newPassword', 'Nova password')}</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="newPassword"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => {
                        setNewPassword(e.target.value);
                        if (newPasswordError) setNewPasswordError(null);
                      }}
                      className="pl-10 pr-10"
                      aria-invalid={newPasswordError ? true : undefined}
                      required
                      minLength={8}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {newPasswordError && (
                    <p className="text-sm text-destructive">{newPasswordError}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmNewPassword">
                    {t('auth.confirmNewPassword', 'Confirmar password')}
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="confirmNewPassword"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={confirmNewPassword}
                      onChange={(e) => {
                        setConfirmNewPassword(e.target.value);
                        if (confirmNewPasswordError) setConfirmNewPasswordError(null);
                      }}
                      className="pl-10"
                      aria-invalid={confirmNewPasswordError ? true : undefined}
                      required
                      minLength={8}
                    />
                  </div>
                  {confirmNewPasswordError && (
                    <p className="text-sm text-destructive">{confirmNewPasswordError}</p>
                  )}
                </div>

                <Button type="submit" className="w-full" disabled={recoveryLoading}>
                  {recoveryLoading
                    ? t('common.loading')
                    : t('auth.changePasswordSubmit', 'Alterar password')}
                </Button>
              </form>
            ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">{t('auth.email')}</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (emailError) setEmailError(null);
                    }}
                    className="pl-10"
                    aria-invalid={emailError ? true : undefined}
                    required
                  />
                </div>
                {emailError && (
                  <p className="text-sm text-destructive">{emailError}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">{t('auth.password')}</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (passwordError) setPasswordError(null);
                    }}
                    className="pl-10 pr-10"
                    aria-invalid={passwordError ? true : undefined}
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {passwordError && (
                  <p className="text-sm text-destructive">{passwordError}</p>
                )}
              </div>

              {mode === 'signup' && (
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">{t('auth.confirmPassword')}</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-10"
                      required
                      minLength={8}
                    />
                  </div>
                </div>
              )}

              {mode === 'login' && (
                <div className="text-right">
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-sm text-primary hover:underline"
                  >
                    {t('auth.forgotPassword')}
                  </button>
                </div>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? t('common.loading') : (mode === 'login' ? t('nav.login') : t('nav.signup'))}
              </Button>
            </form>
            )}

            {!recoveryMode && (
              <>
                {/* Divider */}
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">
                      {t('auth.orContinueWith')}
                    </span>
                  </div>
                </div>

                {/* Google Login */}
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={handleGoogleLogin}
                >
                  <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  {t('auth.google')}
                </Button>

                {/* Switch mode */}
                <p className="text-center text-sm text-muted-foreground mt-6">
                  {mode === 'login' ? t('auth.noAccount') : t('auth.hasAccount')}{' '}
                  <button
                    type="button"
                    className="text-primary font-medium hover:underline"
                    onClick={() => {
                      const newMode = mode === 'login' ? 'signup' : 'login';
                      setMode(newMode);
                      navigate(`/auth?mode=${newMode}`);
                    }}
                  >
                    {mode === 'login' ? t('nav.signup') : t('nav.login')}
                  </button>
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}