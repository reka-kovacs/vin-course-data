export const testEnvironment = "node";
export const clearMocks = true;
export const collectCoverage = true;
export const coverageDirectory = "coverage";
export const coveragePathIgnorePatterns = ["/node_modules/"];
export const moduleFileExtensions = ["js", "json"];
export const testMatch = [
  "**/tests/**/*.[jt]s?(x)",
  "**/?(*.)+(spec|test).[tj]s?(x)",
];
export const transformIgnorePatterns = ["/node_modules/"];
export const transform = {
  "^.+\\.[t|j]sx?$": "babel-jest",
};
export const verbose = true;
