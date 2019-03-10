declare module 'sumchecker' {
  type SumChecker = (
    algo: string,
    shasumFilePath: string,
    baseDir: string,
    files: string[],
  ) => Promise<void>;

  const fn: SumChecker;
  export = fn;
}

declare module 'env-paths';
