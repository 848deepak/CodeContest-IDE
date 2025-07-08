"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CreateContestPage() {
  const [title, setTitle] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [requireFullScreen, setRequireFullScreen] = useState(true);
  const [disableCopyPaste, setDisableCopyPaste] = useState(true);
  const [preventTabSwitching, setPreventTabSwitching] = useState(true);
  const [requireWebcamMonitoring, setRequireWebcamMonitoring] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const router = useRouter();

  const validateFields = () => {
    const errors: Record<string, string> = {};
    
    if (!title.trim()) {
      errors.title = "Contest title is required";
    }
    
    if (!startTime) {
      errors.startTime = "Start time is required";
    }
    
    if (!endTime) {
      errors.endTime = "End time is required";
    }
    
    if (startTime && endTime) {
      const start = new Date(startTime);
      const end = new Date(endTime);
      
      if (end <= start) {
        errors.endTime = "End time must be after start time";
      }
    }
    
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateFields()) {
      setError("Please fix all required fields marked in red");
      return;
    }
    
    setError("");
    try {
      const res = await fetch("/api/contests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          title, 
          startTime, 
          endTime,
          requireFullScreen,
          disableCopyPaste,
          preventTabSwitching,
          requireWebcamMonitoring
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to create contest");
        return;
      }
      router.push("/admin/contests");
    } catch {
      setError("Failed to create contest");
    }
  };

  return (
    <div className="p-8 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Create New Contest</h1>
      <form onSubmit={handleSubmit} className="bg-white rounded shadow p-6 flex flex-col gap-4">
        <label className="font-semibold">
          Title *
          {fieldErrors.title && (
            <span className="text-red-600 text-sm ml-1">{fieldErrors.title}</span>
          )}
          <input
            type="text"
            className={`mt-1 block w-full border ${fieldErrors.title ? 'border-red-500' : 'border-gray-300'} rounded px-3 py-2`}
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Enter contest title"
          />
        </label>
        <label className="font-semibold">
          Start Time *
          {fieldErrors.startTime && (
            <span className="text-red-600 text-sm ml-1">{fieldErrors.startTime}</span>
          )}
          <input
            type="datetime-local"
            className={`mt-1 block w-full border ${fieldErrors.startTime ? 'border-red-500' : 'border-gray-300'} rounded px-3 py-2`}
            value={startTime}
            onChange={e => setStartTime(e.target.value)}
          />
        </label>
        <label className="font-semibold">
          End Time *
          {fieldErrors.endTime && (
            <span className="text-red-600 text-sm ml-1">{fieldErrors.endTime}</span>
          )}
          <input
            type="datetime-local"
            className={`mt-1 block w-full border ${fieldErrors.endTime ? 'border-red-500' : 'border-gray-300'} rounded px-3 py-2`}
            value={endTime}
            onChange={e => setEndTime(e.target.value)}
          />
        </label>

        <div className="mt-6 border-t pt-4">
          <h3 className="text-lg font-semibold mb-3">Security Settings</h3>
          
          <div className="space-y-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="requireFullScreen"
                className="h-4 w-4 text-blue-600 rounded"
                checked={requireFullScreen}
                onChange={e => setRequireFullScreen(e.target.checked)}
              />
              <label htmlFor="requireFullScreen" className="ml-2 block text-gray-900">
                Require Full Screen Mode
                <p className="text-sm text-gray-500">Forces contestants to use full screen during the contest</p>
              </label>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="disableCopyPaste"
                className="h-4 w-4 text-blue-600 rounded"
                checked={disableCopyPaste}
                onChange={e => setDisableCopyPaste(e.target.checked)}
              />
              <label htmlFor="disableCopyPaste" className="ml-2 block text-gray-900">
                Disable Copy/Paste
                <p className="text-sm text-gray-500">Prevents copying and pasting content during the contest</p>
              </label>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="preventTabSwitching"
                className="h-4 w-4 text-blue-600 rounded"
                checked={preventTabSwitching}
                onChange={e => setPreventTabSwitching(e.target.checked)}
              />
              <label htmlFor="preventTabSwitching" className="ml-2 block text-gray-900">
                Prevent Tab Switching
                <p className="text-sm text-gray-500">Detects when contestants switch to other tabs or applications</p>
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="requireWebcamMonitoring"
                className="h-4 w-4 text-blue-600 rounded"
                checked={requireWebcamMonitoring}
                onChange={e => setRequireWebcamMonitoring(e.target.checked)}
              />
              <label htmlFor="requireWebcamMonitoring" className="ml-2 block text-gray-900">
                Enable Webcam Monitoring
                <p className="text-sm text-gray-500">Uses participant's webcam with AI to detect cheating behavior</p>
              </label>
            </div>
          </div>
        </div>

        {error && <div className="text-red-600 font-semibold">{error}</div>}
        <button
          type="submit"
          className="mt-4 px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Create Contest
        </button>
      </form>
    </div>
  );
}
