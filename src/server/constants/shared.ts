/**
 * Type shared with admin panel / client
 *
 * @export
 * @enum {number}
 */
export enum UserScope {
  CREATE_USER = 0,
  DELETE_USER = 1,
  LIST_USERS = 2,

  CREATE_ARTICLE = 3,
  DELETE_ARTICLE = 4,

  CREATE_ARTICLE_CATEGORY = 5,
  DELETE_ARTICLE_CATEGORY = 6,

  CREATE_ATTACHMENT = 7,
  DELETE_ATTACHMENT = 8,
  LIST_ATTACHMENTS = 9,
}
