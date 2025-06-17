export const QUICK_RANGES = [
  { label: "Today", range: { from: new Date(), to: new Date() } },
  {
    label: "Next 7 days",
    range: { from: new Date(), to: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000) }
  },
  {
    label: "This month",
    range: {
      from: new Date(),
      to: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0)
    }
  }
];
