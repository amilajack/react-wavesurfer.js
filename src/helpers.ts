/**
 * Capitalise the first letter of a string
 */
export function capitaliseFirstLetter(string: string) {
  return string
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
}
