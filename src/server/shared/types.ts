export type ID = string | number;

export type Duration<T = Date> = {
  begin?: T,
  end?: T,
};
