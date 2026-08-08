import { useEffect, useState, useCallback } from "react";
import Loading from "../Loading";
import { CustomInput, CustomButton } from "../StyledDefault";
import {
  fetchDefaultContestSportsIQPoints,
  upsertDefaultContestSportsIQPoints,
} from "../../services/contestService";
import { userStore } from "../../store";
import { toast } from "react-toastify";
import Logo from "../Logo";

export const PointsManagePanel = () => {
  const { profileID } = userStore();
  const [points, setPoints] = useState<Record<string, number>>({
    "1": 0,
    "2": 0,
    "3": 0,
    "4": 0,
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const fetchPoints = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchDefaultContestSportsIQPoints();
      setPoints(data || { "1": 0, "2": 0, "3": 0, "4": 0 });
    } catch (error) {
      console.error("Error fetching points:", error);
      toast.error("Failed to fetch points. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPoints();
  }, [fetchPoints]);

  const handlePointChange = (key: string, value: string) => {
    const numValue = value === "" ? 0 : parseInt(value, 10);
    if (!isNaN(numValue)) {
      setPoints((prev) => ({
        ...prev,
        [key]: numValue,
      }));
    }
  };

  const handleSubmit = async () => {
    if (!profileID) return;

    try {
      setSubmitting(true);
      await upsertDefaultContestSportsIQPoints(profileID, points);
      toast.success("Sports IQ points updated successfully");
    } catch (error) {
      console.error("Error upserting sports IQ points:", error);
      toast.error("Failed to save sports IQ points. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <Loading isLight={false} />;
  }

  return (
    <div className="w-full h-full flex items-center justify-center bg-gray-100 p-6">
      <div className="w-full max-w-2xl bg-white rounded-lg shadow-sm p-8">
        <div className="w-fit h-fit flex items-center justify-between gap-4 mb-6">
          <span className="text-2xl font-bold text-gray-900">
            Default Contest
          </span>
          <Logo size="h-8" isLight={false} />
          <span className="text-2xl font-bold text-gray-900">Points</span>
        </div>

        <div className="space-y-4">
          {["1", "2", "3", "4"].map((key) => (
            <CustomInput
              key={key}
              label={`Quarter ${key}:`}
              value={points[key] || 0}
              onChange={(e) => handlePointChange(key, e.target.value)}
              placeholder={`Enter points for quarter ${key}`}
              type="number"
              className="w-full"
            />
          ))}
        </div>

        <div className="mt-6 flex justify-end">
          <CustomButton
            onClick={handleSubmit}
            disabled={submitting}
            className="min-w-[120px]"
          >
            {submitting ? "Saving..." : "Submit"}
          </CustomButton>
        </div>
      </div>
    </div>
  );
};
