import { useEffect, useState, useCallback } from "react";
import Loading from "../Loading";
import {
  fetchDefaultContestPrizes,
  upsertDefaultContestPrizes,
  updateDefaultContestPrizesEnabled,
  upsertDefaultContestPoints,
  updateDefaultContestPointsEnabled,
} from "../../services/contestService";
import { userStore } from "../../store";
import { toast } from "react-toastify";
import { DefaultContestSection } from "./DefaultContestSection";

export const PrizeManagePanel = () => {
  const { profileID } = userStore();
  const [prizes, setPrizes] = useState<Record<string, string> | null>(null);
  const [points, setPoints] = useState<Record<string, number>>({
    "1": 0,
    "2": 0,
    "3": 0,
    "4": 0,
  });
  const [prizesEnabled, setPrizesEnabled] = useState<boolean>(false);
  const [pointsEnabled, setPointsEnabled] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const fetchPrizes = useCallback(async () => {
    if (!profileID) return;

    try {
      setLoading(true);
      const data = await fetchDefaultContestPrizes(profileID);
      setPrizes(data.prizes || null);
      setPrizesEnabled(data.prizes_enabled || false);
      setPoints(data.points || { "1": 0, "2": 0, "3": 0, "4": 0 });
      setPointsEnabled(data.points_enabled || false);
    } catch (error) {
      console.error("Error fetching prizes:", error);
    } finally {
      setLoading(false);
    }
  }, [profileID]);

  useEffect(() => {
    if (profileID) {
      fetchPrizes();
    }
  }, [profileID, fetchPrizes]);

  const handlePrizesToggleChange = async (checked: boolean) => {
    if (!profileID) return;

    try {
      setPrizesEnabled(checked);
      await updateDefaultContestPrizesEnabled(profileID, checked);
      toast.success("Enabled status updated successfully");
    } catch (error) {
      console.error("Error updating enabled status:", error);
      toast.error("Failed to update enabled status. Please try again.");
      setPrizesEnabled(!checked);
    }
  };

  const handlePointsToggleChange = async (checked: boolean) => {
    if (!profileID) return;

    try {
      setPointsEnabled(checked);
      await updateDefaultContestPointsEnabled(profileID, checked);
      toast.success("Enabled status updated successfully");
    } catch (error) {
      console.error("Error updating enabled status:", error);
      toast.error("Failed to update enabled status. Please try again.");
      setPointsEnabled(!checked);
    }
  };

  const handlePrizeChange = (key: string, value: string) => {
    setPrizes((prev) => ({
      ...(prev || {}),
      [key]: value,
    }));
  };

  const handlePointsChange = (key: string, value: string) => {
    const numValue = value === "" ? 0 : parseInt(value, 10);
    if (!isNaN(numValue)) {
      setPoints((prev) => ({
        ...prev,
        [key]: numValue,
      }));
    }
  };

  const handleSubmitPrizes = async () => {
    if (!profileID) return;

    try {
      setSubmitting(true);
      await upsertDefaultContestPrizes(profileID, prizes, prizesEnabled);
      toast.success("Prizes updated successfully");
    } catch (error) {
      console.error("Error upserting prizes:", error);
      toast.error("Failed to save prizes. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitPoints = async () => {
    if (!profileID) return;

    try {
      setSubmitting(true);
      await upsertDefaultContestPoints(profileID, points, pointsEnabled);
      toast.success("Points updated successfully");
    } catch (error) {
      console.error("Error upserting points:", error);
      toast.error("Failed to save points. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <Loading isLight={false} />;
  }

  return (
    <div className="w-full h-full flex items-center justify-center bg-gray-100 p-6 gap-4">
      <DefaultContestSection
        title="Default Contest Prizes"
        values={prizes}
        enabled={prizesEnabled}
        onToggleChange={handlePrizesToggleChange}
        onValueChange={handlePrizeChange}
        onSubmit={handleSubmitPrizes}
        submitting={submitting}
        placeholder="Enter prize {key} description"
        valueType="string"
      />

      <DefaultContestSection
        title="Default Contest Points"
        values={points}
        enabled={pointsEnabled}
        onToggleChange={handlePointsToggleChange}
        onValueChange={handlePointsChange}
        onSubmit={handleSubmitPoints}
        submitting={submitting}
        placeholder="Enter points for quarter {key}"
        valueType="number"
      />
    </div>
  );
};
