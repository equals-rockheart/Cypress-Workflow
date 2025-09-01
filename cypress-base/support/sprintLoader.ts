export function loadSprintTests({
  side,
  module,
}: {
  side: string;
  module: string;
}) {
  const sprintContext = require.context(
    "../../cypress/e2e/sprint",
    false,
    /\.cy\.ts$/
  );

  const originalDescribe = global.describe;
  const originalIt = global.it;

  // Map sprint file -> sprint title (file name without extension)
  const sprintTitles: Record<string, string> = {};
  sprintContext.keys().forEach((file : string) => {
    const baseName = file.replace(/^.*[\\/]/, ""); // strip folder path
    const title = baseName.replace(/\.cy\.ts$/i, ""); // remove extension
    sprintTitles[file] = title; // e.g. "v25"
  });

  // Custom describe to filter by side
  (global as any).describe = (title: string, fn: (this: Mocha.Suite) => void) => {
    // Check if this describe block matches the requested side
    // More flexible matching - check if the side string appears in the title
    const titleLower = title.toLowerCase();
    const sideLower = side.toLowerCase();
    
    // If side is provided and title doesn't contain the side string, skip this block
    if (side && !titleLower.includes(sideLower)) {
      return; // skip entire block if side doesn't match
    }

    type SavedIt = { title: string; fn?: Mocha.Func; scope?: 'only' | 'skip' };
    const savedIts: SavedIt[] = [];

    const makeScopedIt = () => {
        const scopedFn = (itTitle: string, itFn?: Mocha.Func, scope?: 'only' | 'skip') => {
            const match = itTitle.match(/\[(.+?)\]/);
            const moduleNameInTitle = match ? match[1].trim().toLowerCase() : null;

            if (moduleNameInTitle === module.toLowerCase()) {
                const cleanedTitle = itTitle.replace(/\s*\[[^\]]+\]\s*/, ' ');
                const entry: SavedIt = { title: cleanedTitle.trim(), fn: itFn };
                if (scope) entry.scope = scope; // mark if only/skip was used
                savedIts.push(entry);
            }
        };

        const scoped: any = (itTitle: string, itFn?: Mocha.Func) =>
            scopedFn(itTitle, itFn);

        scoped.only = (itTitle: string, itFn?: Mocha.Func) =>
            scopedFn(itTitle, itFn, 'only');

        scoped.skip = (itTitle: string, itFn?: Mocha.Func) =>
            scopedFn(itTitle, itFn, 'skip');

        return scoped;
    };

    const prevDescribe = (global as any).describe;
    const prevIt = (global as any).it;
    (global as any).describe = (nestedTitle: string, nestedFn: (this: Mocha.Suite) => void) => {
      nestedFn.call({} as Mocha.Suite);
    };
    (global as any).it = makeScopedIt();

    fn.call({} as Mocha.Suite);

    (global as any).describe = prevDescribe;
    (global as any).it = prevIt;

    // Filter out tests with .only or .skip
    const filteredTests = savedIts.filter(test => !test.scope);

    if (filteredTests.length === 0) {
      return; // skip if no matching tests after filtering
    }

    // Use the sprint title from the currently loading file
    const currentFile = (global as any).__CURRENT_SPRINT_FILE__;
    const displayTitle = currentFile && sprintTitles[currentFile] ? sprintTitles[currentFile] : title;

    return originalDescribe(displayTitle, () => {
      filteredTests.forEach((t) => {
        originalIt(t.title, t.fn);
      });
    });
  };

  // Load each sprint file individually so it gets its own title
  sprintContext.keys().forEach((file : string) => {
    (global as any).__CURRENT_SPRINT_FILE__ = file;
    sprintContext(file);
    delete (global as any).__CURRENT_SPRINT_FILE__;
  });

  // Restore originals
  (global as any).describe = originalDescribe;
  (global as any).it = originalIt;
}