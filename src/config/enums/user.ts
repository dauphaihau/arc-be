// valid with string contain at least 1 lower letter, 1 uppercase letter, 1 number and 1 special character
export const USER_REGEX_PASSWORD = /^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*\W)(?!.* ).{8,16}$/;

// valid with text, space
export const USER_REGEX_NAME = /^[a-zA-Z\s']+$/;
