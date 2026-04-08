export const resolveImageUrl = (url?: string) => {
  if (!url) return "";
  if (url.startsWith("assets")) {
    // Prepend ../ because assets is a sibling of the utils directory
    return new URL("../" + url, import.meta.url).href;
  }
  return url;
};
