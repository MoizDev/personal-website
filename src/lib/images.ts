// Local image sets (downloaded from Pexels into /public). Served from the repo,
// no runtime API calls. Re-run the download script if you want fresh imagery.
const list = (dir: string, n: number) =>
  Array.from({ length: n }, (_, i) => `/${dir}/${i + 1}.jpg`);

export const arcImages = list("arc", 44);
export const projectImages = list("projects", 8);
export const thoughtImages = list("thoughts", 8);
