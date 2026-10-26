const trackingEventSelect = {
  id: true,
  packageId: true,
  type: true,
  inputMethod: true,
  occurredAt: true,
  recordedAt: true,

  station: {
    select: {
      id: true,
      code: true,
      name: true,
    },
  },

  operator: {
    select: {
      id: true,
      name: true,
    },
  },

  recordedBy: {
    select: {
      id: true,
      name: true,
    },
  },
};

export const packageTrackingSelect = {
  latestTrackingEvent: {
    select: trackingEventSelect,
  },

  trackingEvents: {
    orderBy: [{ occurredAt: "asc" }, { id: "asc" }],
    select: trackingEventSelect,
  },
};
