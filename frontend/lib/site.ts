/**
 * Single source for nav items and credit text (plan section 10). Text only, no metrics.
 * Credit wording is copied from WEBSITE_HANDOFF_SEABED_LENS.md section 1 ("Credit lines the site must carry")
 * and docs/design-system.md section 16 (dataset citation).
 */

export const SITE_NAME = "SeaBed Lens";

/** Rolf has not supplied the repository URL yet (tasks T080). While null the nav shows a placeholder. */
export const GITHUB_URL: string | null = null;

export type NavItem = { label: string; href: string | null };

/** Public nav, left side. /lab is deliberately absent. */
export const NAV_ITEMS: NavItem[] = [
  { label: "Explore", href: "/explore" },
  { label: "Try it", href: "/try" },
  { label: "Results", href: "/results" },
  { label: "About", href: "/about" },
];

/** Public nav, right side. "Thesis" is the About page (spec US1). */
export const NAV_END_ITEMS: NavItem[] = [
  { label: GITHUB_URL ? "GitHub" : "GitHub (link pending)", href: GITHUB_URL },
  { label: "Thesis", href: "/about" },
];

export const credits = {
  jodd: "Images: J-EDI Organism Detection Dataset (JODD), JAMSTEC J-EDI.",
  joddPaper:
    'Paper: T. Nishio and Y. Kawae, "Deep-sea image dataset for organism detection," Data in Brief, vol. 65, p. 112462, 2026, doi:10.1016/j.dib.2026.112462.',
  joddSeg:
    "Instance masks: JODD-Seg, made for this thesis with SAM 3 pseudo-masks reviewed and corrected by three human reviewers.",
  backbones: "Pretrained backbones: ConvNeXt-T (ImageNet), DINOv2 (Meta).",
} as const;

/** Constitution Art. VIII.3 and DS section 16. */
export const joddLicenceLine = "CC BY-NC-SA 4.0, JAMSTEC, scientific and educational use";

/** DS section 16 item 1: the dataset citation pages that show JODD images must carry. */
export const joddDatasetCitation =
  "Takaki Nishio, Yuki Kawae (2025). J-EDI Organism Detection Dataset (JODD). JAMSTEC. https://doi.org/10.17596/0004035";
