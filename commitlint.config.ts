import type { UserConfig } from "@commitlint/types";

const config: UserConfig = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "subject-case": [0],
    "subject-max-length": [2, "always", 100],
  },
};

export default config;
