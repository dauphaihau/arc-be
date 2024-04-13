export const USER_CONFIG = {
  MIN_CHAR_NAME: 3,
  MAX_CHAR_NAME: 60,
  MIN_CHAR_EMAIL: 6,
  MAX_CHAR_EMAIL: 254,
  MIN_CHAR_PASSWORD: 8,
  MAX_CHAR_PASSWORD: 127,
};

// valid with string contain at least 1 lower letter, 1 uppercase letter, 1 number and 1 special character
export const USER_REGEX_PASSWORD = /^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*\W)(?!.* ).{8,16}$/;

// valid with text, space
export const USER_REGEX_NAME = /^[a-zA-Z\s']+$/;
