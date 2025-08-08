declare interface WebpackRequire extends NodeJS.Require {
  context(
    directory: string,
    useSubdirectories?: boolean,
    regExp?: RegExp
  ): {
    keys(): string[];
    <T>(id: string): T;
  };
}

// Tell TS that `require` in our loader is actually `WebpackRequire`
declare var require: WebpackRequire;
