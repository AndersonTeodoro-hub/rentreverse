import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Shield, LogOut, Trash2, Camera, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Layout } from "@/components/layout";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export default function Profile() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, userRole, isLoading: authLoading, signOut } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || "");
      setPhone(profile.phone || "");
      setBio(profile.bio || "");
    }
  }, [profile]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase
        .from("profiles")
        .update({ full_name: fullName, phone, bio })
        .eq("user_id", user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast({ title: t("profile.saved", "Perfil guardado"), description: t("profile.savedDesc", "As alterações foram guardadas.") });
    },
    onError: () => {
      toast({ title: t("common.error", "Erro"), description: t("profile.saveError", "Não foi possível guardar."), variant: "destructive" });
    },
  });

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "Formato inválido", description: "Selecione uma imagem JPG, PNG ou WEBP.", variant: "destructive" });
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "Ficheiro muito grande", description: "Máximo 2MB.", variant: "destructive" });
      return;
    }
    setIsUploadingAvatar(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${user.id}/avatar.${ext}`;
      const { error: uploadError } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
      const avatarUrl = `${urlData.publicUrl}?t=${Date.now()}`;
      const { error: updateError } = await supabase.from("profiles").update({ avatar_url: avatarUrl }).eq("user_id", user.id);
      if (updateError) throw updateError;
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast({ title: "Foto actualizada", description: "A sua foto de perfil foi actualizada." });
    } catch (err: any) {
      toast({ title: "Erro", description: err.message || "Não foi possível carregar a foto.", variant: "destructive" });
    } finally {
      setIsUploadingAvatar(false);
      if (avatarInputRef.current) avatarInputRef.current.value = "";
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const handleChangePassword = async () => {
    if (!user?.email) return;
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/auth`,
      });
      if (error) throw error;
      toast({
        title: t("profile.passwordResetSent", "Email de alteração de password enviado!"),
        description: t("profile.passwordResetSentDesc", "Verifique a sua caixa de entrada."),
      });
    } catch (err: any) {
      toast({
        title: t("common.error", "Erro"),
        description: err.message || t("profile.passwordResetError", "Não foi possível enviar o email."),
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading, navigate]);

  if (authLoading || isLoading) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 bg-muted animate-pulse rounded-xl" />
          ))}
        </div>
      </Layout>
    );
  }

  const displayName = fullName || user?.email?.split("@")[0] || "";
  const initials = displayName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString("pt-PT", { year: "numeric", month: "long" })
    : "";
  const hasChanges =
    fullName !== (profile?.full_name || "") ||
    phone !== (profile?.phone || "") ||
    bio !== (profile?.bio || "");

  return (
    <Layout>
      <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">
            {t("profile.title", "O Meu Perfil")}
          </h1>
          <Button variant="ghost" size="sm" className="gap-2" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
            {t("common.back", "Voltar")}
          </Button>
        </div>

        {/* Section 1 — Personal info */}
        <Card className="rounded-xl">
          <CardContent className="p-6 space-y-6">
            {/* Avatar */}
            <div className="flex items-center gap-5">
              <div className="relative">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="" className="h-20 w-20 rounded-full object-cover" />
                ) : (
                  <div className="h-20 w-20 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold text-2xl">
                    {initials}
                  </div>
                )}
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarUpload}
                />
                <button
                  className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={isUploadingAvatar}
                >
                  {isUploadingAvatar ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                </button>
              </div>
              <div>
                <p className="font-semibold text-foreground text-lg">{displayName}</p>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
              </div>
            </div>

            {/* Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("profile.fullName", "Nome completo")}</Label>
                <Input
                  className="h-11"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="João Silva"
                />
              </div>
              <div className="space-y-2">
                <Label>{t("profile.phone", "Telefone")}</Label>
                <Input
                  className="h-11"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+351 912 345 678"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>{t("profile.email", "Email")}</Label>
                <Input className="h-11" value={user?.email || ""} disabled />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>{t("profile.bio", "Bio")}</Label>
                <Textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder={t("profile.bioPlaceholder", "Fale um pouco sobre si...")}
                  rows={3}
                />
              </div>
            </div>

            <Button
              onClick={() => saveMutation.mutate()}
              disabled={!hasChanges || saveMutation.isPending}
            >
              {saveMutation.isPending
                ? t("common.saving", "A guardar...")
                : t("profile.save", "Guardar alterações")}
            </Button>
          </CardContent>
        </Card>

        {/* Section 2 — Account */}
        <Card className="rounded-xl">
          <CardContent className="p-6 space-y-4">
            <h2 className="font-semibold text-foreground">{t("profile.account", "Conta")}</h2>

            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{t("profile.accountType", "Tipo de conta")}</span>
              <Badge variant="secondary">
                {userRole === "tenant" ? t("dashboard.tenantAccount") : t("dashboard.landlordAccount")}
              </Badge>
            </div>

            {memberSince && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t("profile.memberSince", "Membro desde")}</span>
                <span className="text-sm text-foreground">{memberSince}</span>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <Button variant="outline" size="sm" className="gap-2" onClick={() => navigate("/verifications")}>
                <Shield className="h-4 w-4" />
                {t("profile.verifyProfile", "Verificar perfil")}
              </Button>
              <Button variant="outline" size="sm" className="gap-2" onClick={handleChangePassword}>
                {t("profile.changePassword", "Alterar password")}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Section 3 — Danger zone */}
        <Card className="rounded-xl border-destructive/30">
          <CardContent className="p-6 space-y-4">
            <h2 className="font-semibold text-destructive">{t("profile.dangerZone", "Zona de perigo")}</h2>

            <div className="flex flex-col sm:flex-row gap-2">
              <Button variant="outline" size="sm" className="gap-2" onClick={handleSignOut}>
                <LogOut className="h-4 w-4" />
                {t("profile.signOut", "Terminar sessão")}
              </Button>
              <Button variant="outline" size="sm" disabled className="gap-2 opacity-50 border-destructive/30 text-destructive">
                <Trash2 className="h-4 w-4" />
                {t("profile.deleteAccount", "Eliminar conta")}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              {t("profile.deleteAccountHint", "Para eliminar a sua conta, contacte o suporte.")}
            </p>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
