import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";

export default function SettingsPage() {
  const { toast } = useToast();
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const { data: user, isLoading } = useQuery<any>({
    queryKey: ["/api/auth/session"],
  });

  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    phone: "",
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("PUT", "/api/settings/profile", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/session"] });
      setIsEditingProfile(false);
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("PUT", "/api/settings/password", data);
    },
    onSuccess: () => {
      setIsChangingPassword(false);
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      toast({
        title: "Password changed",
        description: "Your password has been changed successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to change password. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleEditProfile = () => {
    if (user?.user) {
      setProfileData({
        name: user.user.name || "",
        email: user.user.email || "",
        phone: "",
      });
      setIsEditingProfile(true);
    }
  };

  const handleSaveProfile = () => {
    updateProfileMutation.mutate(profileData);
  };

  const handleChangePassword = () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords do not match.",
        variant: "destructive",
      });
      return;
    }
    changePasswordMutation.mutate({
      currentPassword: passwordData.currentPassword,
      newPassword: passwordData.newPassword,
    });
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <div className="max-w-4xl space-y-6" data-testid="settings-page">
      <div>
        <h1 className="text-4xl font-medium tracking-tight mb-2">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and preferences
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>
            Update your personal information and contact details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isEditingProfile ? (
            <>
              <div>
                <Label className="text-muted-foreground">Name</Label>
                <p className="text-lg" data-testid="text-profile-name">{user?.user?.name}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Email</Label>
                <p className="text-lg" data-testid="text-profile-email">{user?.user?.email}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Role</Label>
                <p className="text-lg capitalize" data-testid="text-profile-role">{user?.user?.role}</p>
              </div>
              <Button onClick={handleEditProfile} data-testid="button-edit-profile">
                Edit Profile
              </Button>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={profileData.name}
                  onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                  data-testid="input-profile-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={profileData.email}
                  onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                  data-testid="input-profile-email"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleSaveProfile}
                  disabled={updateProfileMutation.isPending}
                  data-testid="button-save-profile"
                >
                  Save Changes
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsEditingProfile(false)}
                  data-testid="button-cancel-edit-profile"
                >
                  Cancel
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
          <CardDescription>
            Update your password to keep your account secure
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isChangingPassword ? (
            <Button onClick={() => setIsChangingPassword(true)} data-testid="button-change-password">
              Change Password
            </Button>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="current-password">Current Password</Label>
                <Input
                  id="current-password"
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  data-testid="input-current-password"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  data-testid="input-new-password"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm New Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  data-testid="input-confirm-password"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleChangePassword}
                  disabled={changePasswordMutation.isPending}
                  data-testid="button-submit-password"
                >
                  Update Password
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsChangingPassword(false);
                    setPasswordData({
                      currentPassword: "",
                      newPassword: "",
                      confirmPassword: "",
                    });
                  }}
                  data-testid="button-cancel-change-password"
                >
                  Cancel
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
          <CardDescription>
            View your account details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-muted-foreground">User ID</Label>
            <p className="text-sm font-mono" data-testid="text-user-id">{user?.user?.id}</p>
          </div>
          <div>
            <Label className="text-muted-foreground">Account Created</Label>
            <p className="text-sm" data-testid="text-account-created">
              {user?.user?.createdAt ? new Date(user.user.createdAt).toLocaleDateString() : "N/A"}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
