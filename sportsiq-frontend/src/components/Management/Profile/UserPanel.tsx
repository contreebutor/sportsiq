import { useEffect, useState } from "react";
import { MdKeyboardArrowDown, MdOpenInNew } from "react-icons/md";

import { userStore } from "../../../store";
import { updateProfile } from "../../../services/manageService";
import { GameType, UserProfile } from "../../../types/general";
import { CustomMultiSelect } from "../../StyledDefault";

export default function UserPanel() {
  const { profile, setProfile } = userStore();

  const [editForm, setEditForm] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    if (profile) {
      setEditForm(profile);
    }
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm) return;

    setIsLoading(true);
    setMessage(null);

    try {
      const updatedProfile = await updateProfile(editForm);
      if (updatedProfile) {
        setProfile(updatedProfile);
        setEditForm(updatedProfile);
        setMessage({ type: "success", text: "Profile updated successfully!" });
      } else {
        setMessage({
          type: "error",
          text: "Failed to update profile. Please try again.",
        });
      }
    } catch (error) {
      console.error("Failed to update profile: ", error);
      setMessage({
        type: "error",
        text: `Failed to update profile. Please try again. ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!editForm) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-50">
        <div className="text-gray-500">Loading profile...</div>
      </div>
    );
  }

  return (
    <>
      <div className="w-full h-full flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-2xl w-full space-y-8 bg-white p-10 rounded-md shadow flex flex-col items-center justify-start">
          <h1 className="text-3xl font-bold mb-8 text-gray-900">
            Manage Your Settings
          </h1>

          {message && (
            <div
              className={`w-full p-4 rounded-md ${
                message.type === "success"
                  ? "bg-green-50 text-green-800 border border-green-200"
                  : "bg-red-50 text-red-800 border border-red-200"
              }`}
            >
              {message.text}
            </div>
          )}

          <form className="w-full space-y-4" onSubmit={handleSubmit}>
            <LabeledInput
              id="username"
              label="Username"
              value={editForm.username}
              onChange={(e) =>
                setEditForm({ ...editForm, username: e.target.value })
              }
            />
            <div className="w-full flex items-center gap-4 text-lg">
              <label
                htmlFor="dashboardGameTypes"
                className="w-60 shrink-0 text-right font-medium text-gray-900"
              >
                Dashboard Game Types
              </label>
              <div className="max-w-xs w-full">
                <CustomMultiSelect
                  id="dashboardGameTypes"
                  options={[
                    { label: "NBA", value: "nba" },
                    { label: "NFL", value: "nfl" },
                    { label: "NHL", value: "nhl" },
                    { label: "CBB", value: "cbb" },
                    { label: "MLB", value: "mlb" },
                  ]}
                  selected={editForm.dashboardGameTypes}
                  onChange={(next) =>
                    setEditForm({
                      ...editForm,
                      dashboardGameTypes: next as GameType[],
                    })
                  }
                  placeholder="Select game types..."
                />
              </div>
            </div>
            <LabeledDropdown
              id="dashboardCardCount"
              label="Dashboard Card Count"
              value={editForm.dashboardCardCount}
              options={[
                { value: 4, label: "4" },
                { value: 8, label: "8" },
              ]}
              onChange={(e) =>
                setEditForm({
                  ...editForm,
                  dashboardCardCount: parseInt(e.target.value) || 0,
                })
              }
            />

            <div className="relative">
              <LabeledInput
                id="intervalDashboardRotationTime"
                label="Dashboard Rotation"
                type="number"
                value={editForm.intervalDashboardRotationTime}
                onChange={(e) =>
                  setEditForm({
                    ...editForm,
                    intervalDashboardRotationTime:
                      parseInt(e.target.value) || 0,
                  })
                }
              />
              {editForm.dashboardGameTypes.length < 2 && (
                <span className="absolute w-full h-full bg-white/50 top-0 left-0 hover:cursor-not-allowed" />
              )}
            </div>
            <LabeledInput
              id="intervalCardRotationTime"
              label="Card Rotation"
              type="number"
              value={editForm.intervalCardRotationTime}
              onChange={(e) =>
                setEditForm({
                  ...editForm,
                  intervalCardRotationTime: parseInt(e.target.value) || 0,
                })
              }
            />
            <LabeledDropdown
              id="contestEnabled"
              label="Contest Enabled"
              value={editForm.contestEnabled ? "true" : "false"}
              options={[
                { value: "true", label: "Yes" },
                { value: "false", label: "No" },
              ]}
              onChange={(e) =>
                setEditForm({
                  ...editForm,
                  contestEnabled: e.target.value === "true",
                })
              }
            />

            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-lg font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 mt-8 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Saving..." : "Save"}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}

// Input component matching SignIn.tsx styling
const LabeledInput = ({
  id,
  label,
  value,
  onChange,
  type = "text",
  disabled = false,
}: {
  id: string;
  label: string;
  value: string | number | undefined;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  disabled?: boolean;
}) => {
  return (
    <div className="w-full flex items-center gap-4 text-lg">
      <label
        htmlFor={id}
        className="w-60 shrink-0 text-right font-medium text-gray-900"
      >
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value ?? ""}
        onChange={onChange}
        disabled={disabled}
        required={!disabled}
        className="appearance-none rounded-md relative block w-full max-w-xs px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 disabled:bg-gray-100 disabled:cursor-not-allowed"
      />
    </div>
  );
};

// Dropdown component matching SignIn.tsx styling, with an end icon (chevron)

const LabeledDropdown = <T extends string | number>({
  id,
  label,
  value,
  options,
  onChange,
}: {
  id: string;
  label: string;
  value: T | undefined;
  options: { label: string; value: T }[];
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}) => {
  return (
    <div className="w-full flex items-center gap-4 text-lg">
      <label
        htmlFor={id}
        className="w-60 shrink-0 text-right font-medium text-gray-900"
      >
        {label}
      </label>
      <div className="relative w-full max-w-xs">
        <select
          id={id}
          value={value ?? ""}
          onChange={onChange}
          required
          className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 pr-10"
        >
          {options.map(({ label, value }) => (
            <option key={String(value)} value={value}>
              {label}
            </option>
          ))}
        </select>
        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-500">
          <MdKeyboardArrowDown size={24} />
        </span>
      </div>
    </div>
  );
};
