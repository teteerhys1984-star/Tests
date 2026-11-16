import { LESSON2IMAGES } from "./lesson2Images";
import { LESSON3IMAGES } from "./lesson3Images";
import { LESSON4IMAGES } from "./lesson4Images";
import { LESSON5SCHOOLIMAGE } from "./lesson5SchoolImage";
import { LESSON5WORKBOOKIMAGES } from "./lesson5WorkbookImages";

export const CURRICULUM_IMAGES = {
  ...LESSON2IMAGES,
  ...LESSON3IMAGES,
  ...LESSON4IMAGES,
  ...LESSON5SCHOOLIMAGE,
  ...LESSON5WORKBOOKIMAGES,
} as const;

export type CurriculumImageKey = keyof typeof CURRICULUM_IMAGES;
