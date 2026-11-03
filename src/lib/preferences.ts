export const fonts = [
  {
    id: "sora",
    name: "Sora",
    family: '"Sora", sans-serif',
    note: "Sculptural · contemporary",
  },
  {
    id: "space",
    name: "Space Grotesk",
    family: '"Space Grotesk", sans-serif',
    note: "Technical · expressive",
  },
  {
    id: "outfit",
    name: "Outfit",
    family: '"Outfit", sans-serif',
    note: "Geometric · fluid",
  },
  {
    id: "dm",
    name: "DM Sans",
    family: '"DM Sans", sans-serif',
    note: "Clear · versatile",
  },
  {
    id: "inter",
    name: "Inter",
    family: '"Inter", sans-serif',
    note: "Precise · readable",
  },
  {
    id: "manrope",
    name: "Manrope",
    family: '"Manrope", sans-serif',
    note: "Modern · balanced",
  },
  {
    id: "playfair",
    name: "Playfair Display",
    family: '"Playfair Display", Georgia, serif',
    note: "Editorial · dramatic",
  },
  {
    id: "lora",
    name: "Lora",
    family: '"Lora", Georgia, serif',
    note: "Literary · warm",
  },
  {
    id: "caslon",
    name: "Libre Caslon Display",
    family: '"Libre Caslon Display", Georgia, serif',
    note: "Artistic · timeless",
  },
  {
    id: "mono",
    name: "JetBrains Mono",
    family: '"JetBrains Mono", monospace',
    note: "Digital · structured",
  },
] as const;
export type FontId = (typeof fonts)[number]["id"];
export type SiteSettings = {
  id: true;
  heading_font: FontId;
  body_font: FontId;
  default_theme: "dark" | "light";
};
export const defaultSettings: SiteSettings = {
  id: true,
  heading_font: "sora",
  body_font: "dm",
  default_theme: "dark",
};
export function fontFamily(id: string) {
  return fonts.find((f) => f.id === id)?.family || fonts[0].family;
}
export function categoryName(name: string) {
  const clean = name.trim().replace(/\s+/g, " ");
  if (!clean || clean.length > 60)
    throw Error("Use a category name between 1 and 60 characters.");
  if (["all stories", "uncategorized"].includes(clean.toLowerCase()))
    throw Error("That name is reserved. Choose a different category name.");
  return clean;
}
