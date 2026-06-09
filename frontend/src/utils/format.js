export function formatDate(dateValue) {
  if (!dateValue) return "-";
  const date = new Date(dateValue);
  return date.toLocaleString();
}

export function toTitle(value) {
  if (!value) return "";
  return value.charAt(0).toUpperCase() + value.slice(1);
}
