import { useCallback, useEffect, useState } from "react";
import { MdOpenInNew, MdDelete, MdLockReset } from "react-icons/md";
import { toast } from "react-toastify";

import { userStore } from "../../../store";
import {
  updateProfile,
  createProfile,
  deleteProfile,
  fetchProfilesByProfileID,
} from "../../../services/manageService";
import { GameType, UserProfile } from "../../../types/general";
import {
  CustomDropdown,
  CustomInput,
  CustomMultiSelect,
  CustomToggle,
  CustomButton,
} from "../../StyledDefault";

export default function AdminPanel() {
  const { profiles, setProfiles, profileID } = userStore();
  const [editableProfiles, setEditableProfiles] = useState<UserProfile[]>([]);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [newProfile, setNewProfile] = useState({
    email: "",
    username: "",
    notes: "",
  });
  const [isCreating, setIsCreating] = useState<boolean>(false);

  useEffect(() => {
    if (profiles) {
      setEditableProfiles(profiles);
    }
  }, [profiles]);

  // Debounce function
  function debounce<T extends (...args: unknown[]) => unknown>(
    func: T,
    delay: number
  ): (...args: Parameters<T>) => void {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    return function (this: ThisParameterType<T>, ...args: Parameters<T>): void {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      timeoutId = setTimeout(() => {
        func.apply(this, args);
        timeoutId = null;
      }, delay);
    };
  }

  const debouncedUpdateProfile = useCallback(
    debounce(async (profile: UserProfile) => {
      try {
        await updateProfile(profile);
        toast.success(
          `Profile updated successfully for ${profile.username || profile.id}`
        );
      } catch (error) {
        console.error("Failed to update profile:", error);
        toast.error(
          `Failed to update profile for ${profile.username || profile.id}`
        );
      }
    }, 1000),
    []
  );

  const updateProfileField = (
    profileId: string,
    field: keyof UserProfile,
    value: string | number | boolean | GameType[]
  ) => {
    const updatedProfiles = editableProfiles.map((profile) => {
      if (profile.id === profileId) {
        const updatedProfile = { ...profile, [field]: value };
        debouncedUpdateProfile(updatedProfile);
        return updatedProfile;
      }
      return profile;
    });
    setProfiles(updatedProfiles);
    setEditableProfiles(updatedProfiles);
  };

  const refreshProfiles = async () => {
    if (!profileID) return;
    try {
      const response = await fetchProfilesByProfileID(profileID);
      if (response) {
        setProfiles(response.profiles);
        setEditableProfiles(response.profiles);
      }
    } catch (error) {
      console.error("Failed to refresh profiles:", error);
    }
  };

  const handleCreateProfile = async () => {
    if (!newProfile.email || !newProfile.username) {
      toast.error("Email and username are required");
      return;
    }

    setIsCreating(true);
    try {
      await createProfile({
        email: newProfile.email,
        username: newProfile.username,
        notes: newProfile.notes,
      });
      toast.success("Profile created successfully");
      setIsModalOpen(false);
      setNewProfile({ email: "", username: "", notes: "" });
      await refreshProfiles();
    } catch (error) {
      console.error("Failed to create profile:", error);
      toast.error("Failed to create profile");
    } finally {
      setIsCreating(false);
    }
  };

  const handleResetPassword = async (profileId: string) => {
    const newPassword = window.prompt("Enter new password:");
    if (!newPassword || !newPassword.trim()) return;

    try {
      const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
      const res = await fetch(`${BACKEND_URL}/v1/manage/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile_id: profileId, new_password: newPassword.trim() }),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success("Password reset successfully");
    } catch (error) {
      console.error("Failed to reset password:", error);
      toast.error("Failed to reset password");
    }
  };

  const handleDeleteProfile = async (profileId: string) => {
    if (!window.confirm("Are you sure you want to delete this profile?")) {
      return;
    }

    try {
      await deleteProfile(profileId);
      toast.success("Profile deleted successfully");
      await refreshProfiles();
    } catch (error) {
      console.error("Failed to delete profile:", error);
      toast.error("Failed to delete profile");
    }
  };

  if (!profiles || profiles.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-50">
        <div className="text-gray-500">No profiles found</div>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-gray-50 p-4">
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              User Management
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Manage all user profiles. Changes are saved automatically after
              1s.
            </p>
          </div>
          <CustomButton
            onClick={() => setIsModalOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            Add new user
          </CustomButton>
        </div>

        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-3 text-center text-sm font-medium text-gray-500 uppercase tracking-wider w-24">
                ID
              </th>
              <th className="px-4 py-3 text-center text-sm font-medium text-gray-500 uppercase tracking-wider min-w-[200px]">
                Username
              </th>
              <th className="px-4 py-3 text-center text-sm font-medium text-gray-500 uppercase tracking-wider min-w-[200px]">
                Notes
              </th>
              <th className="px-4 py-3 text-center text-sm font-medium text-gray-500 uppercase tracking-wider w-40">
                Game Types
              </th>
              <th className="px-4 py-3 text-center text-sm font-medium text-gray-500 uppercase tracking-wider w-40">
                Card Count
              </th>
              <th className="px-3 py-3 text-center text-sm font-medium text-gray-500 uppercase tracking-wider w-40">
                <div className="leading-tight">
                  Dashboard
                  <br />
                  Rotation
                </div>
              </th>
              <th className="px-3 py-3 text-center text-sm font-medium text-gray-500 uppercase tracking-wider w-40">
                <div className="leading-tight">
                  Card
                  <br />
                  Rotation
                </div>
              </th>
              <th className="px-4 py-3 text-center text-sm font-medium text-gray-500 uppercase tracking-wider w-24">
                Contest Enabled
              </th>
              <th className="px-4 py-3 text-center text-sm font-medium text-gray-500 uppercase tracking-wider w-32">
                <div className="leading-tight">
                  Contest
                  <br />
                  Dashboard
                </div>
              </th>
              <th className="px-4 py-3 text-center text-sm font-medium text-gray-500 uppercase tracking-wider w-24">
                Admin
              </th>
              <th className="px-4 py-3 text-center text-sm font-medium text-gray-500 uppercase tracking-wider w-24">
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="bg-white divide-y divide-gray-200">
            {editableProfiles.map((profile) => (
              <tr key={profile.id} className="hover:bg-gray-50">
                {/* ID */}
                <td className="px-3 py-3 whitespace-nowrap">
                  <div className="flex items-center gap-1">
                    <span
                      className="text-base font-medium text-gray-900 truncate max-w-[80px]"
                      title={profile.id}
                    >
                      {profile.id}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        window.open(
                          `${window.location.origin}/dashboard/${profile.id}`,
                          "_blank"
                        )
                      }
                      className="text-indigo-600 hover:text-indigo-800 focus:outline-none transition-colors flex-shrink-0 hover:cursor-pointer"
                      title="Open dashboard in new tab"
                    >
                      <MdOpenInNew size={16} />
                    </button>
                  </div>
                </td>

                {/* Username */}
                <td className="px-4 py-3">
                  <CustomInput
                    value={profile.username ?? ""}
                    onChange={(e) =>
                      updateProfileField(profile.id, "username", e.target.value)
                    }
                  />
                </td>

                {/* Notes */}
                <td className="px-4 py-3">
                  <CustomInput
                    value={profile.notes ?? ""}
                    onChange={(e) =>
                      updateProfileField(profile.id, "notes", e.target.value)
                    }
                  />
                </td>

                {/* Dashboard Game Types */}
                <td className="px-4 py-3 whitespace-nowrap">
                  <CustomMultiSelect
                    options={[
                      { label: "NBA", value: "nba" },
                      { label: "NFL", value: "nfl" },
                      { label: "NHL", value: "nhl" },
                      { label: "CBB", value: "cbb" },
                      { label: "MLB", value: "mlb" },
                    ]}
                    selected={profile.dashboardGameTypes}
                    onChange={(next) =>
                      updateProfileField(
                        profile.id,
                        "dashboardGameTypes",
                        next as GameType[]
                      )
                    }
                    placeholder="Select game types..."
                    triggerClassName="min-w-[140px]"
                  />
                </td>

                {/* Dashboard Card Count */}
                <td className="px-4 py-3 whitespace-nowrap">
                  <CustomDropdown
                    selected={{
                      label: profile.dashboardCardCount.toString(),
                      value: profile.dashboardCardCount.toString(),
                    }}
                    options={[
                      { label: "4", value: "4" },
                      { label: "8", value: "8" },
                    ]}
                    onChange={(e) =>
                      updateProfileField(
                        profile.id,
                        "dashboardCardCount",
                        parseInt(e.value)
                      )
                    }
                  />
                </td>

                {/* Dashboard Rotation Time */}
                <td className="px-3 py-3 whitespace-nowrap">
                  <div className="relative">
                    <CustomInput
                      type="number"
                      value={profile.intervalDashboardRotationTime}
                      onChange={(e) =>
                        updateProfileField(
                          profile.id,
                          "intervalDashboardRotationTime",
                          parseInt(e.target.value) || 0
                        )
                      }
                      disabled={profile.dashboardGameTypes.length < 2}
                    />
                  </div>
                </td>

                {/* Card Rotation Time */}
                <td className="px-3 py-3 whitespace-nowrap">
                  <CustomInput
                    type="number"
                    value={profile.intervalCardRotationTime}
                    onChange={(e) =>
                      updateProfileField(
                        profile.id,
                        "intervalCardRotationTime",
                        parseInt(e.target.value) || 0
                      )
                    }
                  />
                </td>
                {/* Contest Enabled */}
                <td className="px-4 py-3 text-center whitespace-nowrap">
                  <CustomToggle
                    checked={profile.contestEnabled}
                    onChange={(checked) =>
                      updateProfileField(profile.id, "contestEnabled", checked)
                    }
                  />
                </td>

                {/* Contest Dashboard Type */}
                <td className="px-4 py-3 whitespace-nowrap">
                  <CustomDropdown
                    selected={{
                      label: `Type ${profile.contestDashboardType ?? 1}`,
                      value: String(profile.contestDashboardType ?? 1),
                    }}
                    options={[
                      { label: "Type 1", value: "1" },
                      { label: "Type 2", value: "2" },
                    ]}
                    onChange={(e) =>
                      updateProfileField(
                        profile.id,
                        "contestDashboardType",
                        parseInt(e.value)
                      )
                    }
                    disabled={!profile.contestEnabled}
                  />
                </td>

                {/* Admin */}
                <td className="px-4 py-3 whitespace-nowrap text-center">
                  <span className="text-base text-gray-600">
                    {profile.isAdmin ? "YES" : "NO"}
                  </span>
                </td>

                {/* Actions */}
                <td className="px-4 py-3 whitespace-nowrap text-center">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleResetPassword(profile.id)}
                      className="text-blue-600 hover:text-blue-800 focus:outline-none transition-colors hover:cursor-pointer"
                      title="Reset password"
                    >
                      <MdLockReset size={20} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteProfile(profile.id)}
                      className="text-red-600 hover:text-red-800 focus:outline-none transition-colors hover:cursor-pointer"
                      title="Delete profile"
                    >
                      <MdDelete size={20} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create Profile Modal */}
      <CreateProfileModal
        isOpen={isModalOpen}
        setIsOpen={setIsModalOpen}
        newProfile={newProfile}
        setNewProfile={setNewProfile}
        handleCreateProfile={handleCreateProfile}
        isCreating={isCreating}
      />
    </div>
  );
}

interface CreateProfileModalProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  newProfile: {
    email: string;
    username: string;
    notes: string;
  };
  setNewProfile: (newProfile: {
    email: string;
    username: string;
    notes: string;
  }) => void;
  handleCreateProfile: () => void;
  isCreating: boolean;
}

const CreateProfileModal = ({
  isOpen,
  setIsOpen,
  newProfile,
  setNewProfile,
  handleCreateProfile,
  isCreating,
}: CreateProfileModalProps) => {
  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Create New User
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <CustomInput
                  type="email"
                  value={newProfile.email}
                  onChange={(e) =>
                    setNewProfile({ ...newProfile, email: e.target.value })
                  }
                  placeholder="Enter email"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <CustomInput
                  type="text"
                  value="Default password (set on server)"
                  onChange={() => {}}
                  disabled
                  className="bg-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Username *
                </label>
                <CustomInput
                  type="text"
                  value={newProfile.username}
                  onChange={(e) =>
                    setNewProfile({ ...newProfile, username: e.target.value })
                  }
                  placeholder="Enter username"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <CustomInput
                  type="text"
                  value={newProfile.notes}
                  onChange={(e) =>
                    setNewProfile({ ...newProfile, notes: e.target.value })
                  }
                  placeholder="Enter notes"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <CustomButton
                onClick={handleCreateProfile}
                disabled={isCreating || !newProfile.email.trim() || !newProfile.username.trim() || !newProfile.notes.trim()}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                {isCreating ? "Creating..." : "Submit"}
              </CustomButton>
              <CustomButton
                onClick={() => {
                  setIsOpen(false);
                  setNewProfile({ email: "", username: "", notes: "" });
                }}
                disabled={isCreating}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-900"
              >
                Cancel
              </CustomButton>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
