"use client";

import React from "react";
import type { Event } from "@/lib/tour/types";
import { niceModelName } from "@/lib/model-metadata";
import { DefaultPolicy } from "@/lib/tour/policy";

type EventsDisplayProps = {
  events: Event[];
  selectedEvent: Event | null;
  onEventSelect: (event: Event | null) => void;
  onModelSelect?: (modelId: string) => void;
};

export function EventsDisplay({ events, selectedEvent, onEventSelect, onModelSelect }: EventsDisplayProps) {
  // Filtering state
  const [selectedModelFilter, setSelectedModelFilter] = React.useState<string>("");
  const [selectedTypeFilter, setSelectedTypeFilter] = React.useState<string>("");
  const [eventsPerTypeLimit, setEventsPerTypeLimit] = React.useState<number | null>(3);

  // Get unique models and types for filter options
  const availableModels = React.useMemo(() => {
    const models = new Set(events.map(e => e.modelId));
    return Array.from(models).sort();
  }, [events]);

  const availableTypes = React.useMemo(() => {
    const types = new Set(events.map(e => e.type));
    return Array.from(types).sort();
  }, [events]);

  // Sort and filter events using the same logic as TourGuide
  const sortedEvents = React.useMemo(() => {
    let filtered = events.filter((e) => (DefaultPolicy.mins[e.type] ?? -Infinity) < e.magnitudeRaw);

    // Apply filters
    if (selectedModelFilter) {
      filtered = filtered.filter(e => e.modelId === selectedModelFilter);
    }
    if (selectedTypeFilter) {
      filtered = filtered.filter(e => e.type === selectedTypeFilter);
    }

    function scoreOf(e: Event): number {
      return (DefaultPolicy.weights[e.type] ?? 0) * e.magnitudeNorm;
    }

    // Sort first
    const sorted = filtered.slice().sort((a, b) =>
      scoreOf(b) - scoreOf(a) ||
      b.magnitudeRaw - a.magnitudeRaw ||
      a.round - b.round ||
      a.modelId.localeCompare(b.modelId) ||
      a.type.localeCompare(b.type)
    );

    // Apply per-type limit if specified
    if (eventsPerTypeLimit !== null) {
      const eventsByType = new Map<string, Event[]>();

      // Group events by type
      for (const event of sorted) {
        if (!eventsByType.has(event.type)) {
          eventsByType.set(event.type, []);
        }
        eventsByType.get(event.type)!.push(event);
      }

      // Take only the first N events per type
      const limitedEvents: Event[] = [];
      for (const [type, typeEvents] of eventsByType) {
        limitedEvents.push(...typeEvents.slice(0, eventsPerTypeLimit));
      }

      // Re-sort the limited events
      return limitedEvents.sort((a, b) =>
        scoreOf(b) - scoreOf(a) ||
        b.magnitudeRaw - a.magnitudeRaw ||
        a.round - b.round ||
        a.modelId.localeCompare(b.modelId) ||
        a.type.localeCompare(b.type)
      );
    }

    return sorted;
  }, [events, selectedModelFilter, selectedTypeFilter, eventsPerTypeLimit]);

  const getEventTypeLabel = (type: Event["type"]) => {
    switch (type) {
      case "first_to_top": return "First to Top";
      case "lead_change": return "Lead Change";
      case "big_jump": return "Big Jump";
      case "max_token_positive": return "Max Token +";
      case "max_token_negative": return "Max Token -";
      default: return type;
    }
  };

  const getEventTypeColor = (type: Event["type"]) => {
    switch (type) {
      case "first_to_top": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "lead_change": return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      case "big_jump": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "max_token_positive": return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200";
      case "max_token_negative": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const getEventDescription = (event: Event) => {
    switch (event.type) {
      case "first_to_top":
        return `${niceModelName(event.modelId)} reaches #1 from rank ${event.details.startRank}`;
      case "lead_change":
        return `${niceModelName(event.modelId)} takes the lead from ${niceModelName(event.details.previousLeaderId as string)}`;
      case "big_jump":
        return `${niceModelName(event.modelId)} improves by ${event.details.delta?.toFixed(1)} points`;
      case "max_token_positive":
        return `${niceModelName(event.modelId)} has strongest positive token impact (+${event.magnitudeRaw.toFixed(2)})`;
      case "max_token_negative":
        return `${niceModelName(event.modelId)} has strongest negative token impact (${event.magnitudeRaw.toFixed(2)})`;
      default:
        return `${niceModelName(event.modelId)} - ${event.type}`;
    }
  };

  const getEventScore = (event: Event) => {
    return (DefaultPolicy.weights[event.type] ?? 0) * event.magnitudeNorm;
  };

  if (sortedEvents.length === 0) {
    return (
      <div className="text-sm opacity-80">
        No significant events detected in this dataset.
      </div>
    );
  }

  const handleEventClick = (event: Event, isSelected: boolean) => {
    onEventSelect(isSelected ? null : event);
    if (onModelSelect && !isSelected) {
      onModelSelect(event.modelId);
    }
  };

  return (
    <div className="space-y-3">
      {/* Filter Controls */}
      <div className="flex flex-wrap gap-3 mb-3">
        <div className="flex-1 min-w-[150px]">
          <label className="block text-xs font-medium mb-1 opacity-70">Filter by Model</label>
          <select
            className="w-full text-sm rounded border px-2 py-1 bg-transparent"
            value={selectedModelFilter}
            onChange={(e) => setSelectedModelFilter(e.target.value)}
          >
            <option value="">All Models</option>
            {availableModels.map((modelId) => (
              <option key={modelId} value={modelId}>{niceModelName(modelId)}</option>
            ))}
          </select>
        </div>

        <div className="flex-1 min-w-[150px]">
          <label className="block text-xs font-medium mb-1 opacity-70">Filter by Type</label>
          <select
            className="w-full text-sm rounded border px-2 py-1 bg-transparent"
            value={selectedTypeFilter}
            onChange={(e) => setSelectedTypeFilter(e.target.value)}
          >
            <option value="">All Types</option>
            {availableTypes.map((type) => (
              <option key={type} value={type}>{getEventTypeLabel(type)}</option>
            ))}
          </select>
        </div>

        <div className="flex-1 min-w-[120px]">
          <label className="block text-xs font-medium mb-1 opacity-70">Max per Type</label>
          <select
            className="w-full text-sm rounded border px-2 py-1 bg-transparent"
            value={eventsPerTypeLimit === null ? "" : eventsPerTypeLimit.toString()}
            onChange={(e) => {
              const value = e.target.value;
              setEventsPerTypeLimit(value === "" ? null : parseInt(value, 10));
            }}
          >
            <option value="">No Limit</option>
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="5">5</option>
            <option value="10">10</option>
          </select>
        </div>

        <div className="flex items-end">
          <button
            type="button"
            className="text-xs px-2 py-1 rounded border hover:bg-gray-50 dark:hover:bg-gray-800"
            onClick={() => {
              setSelectedModelFilter("");
              setSelectedTypeFilter("");
              setEventsPerTypeLimit(null);
            }}
          >
            Clear Filters
          </button>
        </div>
      </div>

      <div className="text-sm opacity-70 mb-2">
        Found {sortedEvents.length} significant events (sorted by tour priority):
      </div>

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {sortedEvents.map((event, index) => {
          const isSelected = selectedEvent?.type === event.type &&
                           selectedEvent?.modelId === event.modelId &&
                           selectedEvent?.round === event.round;

          return (
            <div
              key={`${event.type}-${event.modelId}-${event.round}-${index}`}
              className={`p-3 rounded-md border cursor-pointer transition-colors ${
                isSelected
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-950"
                  : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
              }`}
              onClick={() => handleEventClick(event, isSelected)}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-1 text-xs font-medium rounded ${getEventTypeColor(event.type)}`}>
                      {getEventTypeLabel(event.type)}
                    </span>
                    <span className="text-xs opacity-60">Round {event.round + 1}</span>
                  </div>
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {getEventDescription(event)}
                  </div>
                </div>

                <div className="text-right text-xs opacity-60 space-y-1">
                  <div>Score: {getEventScore(event).toFixed(2)}</div>
                  <div>Raw: {event.magnitudeRaw.toFixed(2)}</div>
                  <div>Norm: {event.magnitudeNorm.toFixed(2)}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {selectedEvent && (
        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950 rounded-md border border-blue-200 dark:border-blue-800">
          <div className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
            Selected Event Details
          </div>
          <div className="text-xs space-y-1 text-blue-800 dark:text-blue-200">
            <div><strong>Type:</strong> {getEventTypeLabel(selectedEvent.type)}</div>
            <div><strong>Model:</strong> {niceModelName(selectedEvent.modelId)}</div>
            <div><strong>Round:</strong> {selectedEvent.round + 1}</div>
            <div><strong>Magnitude Raw:</strong> {selectedEvent.magnitudeRaw.toFixed(3)}</div>
            <div><strong>Magnitude Norm:</strong> {selectedEvent.magnitudeNorm.toFixed(3)}</div>
            <div><strong>Tour Score:</strong> {getEventScore(selectedEvent).toFixed(3)}</div>
            {Object.keys(selectedEvent.details).length > 0 && (
              <div>
                <strong>Details:</strong> {JSON.stringify(selectedEvent.details, null, 2)}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
