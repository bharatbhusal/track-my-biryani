module.exports = {
  family,
  isAccessory,
  isSmall,
  isMedium,
  isLarge,
  isExtraLarge,
  isCircular,
  isRectangular,
  isInline,
  mode,
  scale,
  font,
};

// ponytail: widgetFamily/runsInAccessoryWidget live on Scriptable's GLOBAL `config`, not our settings module

function family() {
  return config.widgetFamily;
}

function isAccessory() {
  return config.runsInAccessoryWidget;
}

function isSmall() {
  return config.widgetFamily === "small";
}

function isMedium() {
  return config.widgetFamily === "medium";
}

function isLarge() {
  // includes extraLarge for convenience — use isExtraLarge() for strict check
  return config.widgetFamily === "large" || config.widgetFamily === "extraLarge";
}

function isExtraLarge() {
  return config.widgetFamily === "extraLarge";
}

function isCircular() {
  return config.widgetFamily === "accessoryCircular";
}

function isRectangular() {
  return config.widgetFamily === "accessoryRectangular";
}

function isInline() {
  return config.widgetFamily === "accessoryInline";
}

function mode() {
  const f = config.widgetFamily;
  if (f === "small" || config.runsInAccessoryWidget) return "compact";
  if (f === "medium") return "standard";
  if (f === "large" || f === "extraLarge") return "expanded";
  return "standard";
}

function scale(pts) {
  const f = config.widgetFamily;
  if (f === "large" || f === "extraLarge") return pts * 1.15;
  return pts;
}

function font(weight, pts) {
  const size = scale(pts);
  switch (weight) {
    case "bold":
      return Font.boldSystemFont(size);
    case "semibold":
      return Font.semiboldSystemFont(size);
    case "medium":
      return Font.mediumSystemFont(size);
    case "mono":
      return Font.mediumMonospacedSystemFont(size);
    default:
      return Font.systemFont(size);
  }
}
