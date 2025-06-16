import {
  IBaseUser,
  IMedia,
  IPaginationParams,
  ITag,
} from "@/definitions/types";
import {
  createRecord,
  deleteRecord,
  findAllWithPagination,
  findById,
  updateRecord,
} from "@utils/dbUtils";
import { validateUserCreate, validateUserUpdate } from "./validation";
import { User } from "./model";
import {
  bulkGetUserCache,
  bulkSetUserCache,
  deleteAllUserCache,
  deleteUserCache,
  deleteUserInterestsCache,
  getSafeUser,
  getLeanUser,
  getUserCache,
  getUserCacheByEmail,
  getUserCacheByUsername,
  getUserInterestsCache,
  setUserCache,
  setUserCacheByEmail,
  setUserCacheByUsername,
  setUserInterestsCache,
} from "./helpers";
import { MethodCacheSync } from "@decorators";
import { BadRequestError, NotFoundError } from "@exceptions";
import { isEmpty } from "@utils";
import TagService from "@features/tags/service";
import MediaService from "@features/media/service";

class UserService {
  private readonly getCache = getUserCache;
  private readonly setCache = setUserCache;
  private readonly deleteCache = deleteUserCache;

  private readonly tagService: TagService;
  private readonly mediaService: MediaService;

  constructor() {
    this.tagService = new TagService();
    this.mediaService = new MediaService();
  }

  async _getByIdNoCache(id: string) {
    return findById(User, id);
  }

  async getAll(
    where: Record<string, any> = {},
    pagination?: Partial<IPaginationParams>,
    select?: string
  ) {
    return findAllWithPagination(User, where, pagination, select);
  }

  @MethodCacheSync<IBaseUser>()
  async create(
    data: Partial<IBaseUser>
  ): Promise<{ data: IBaseUser | null; error: any }> {
    return validateUserCreate(data, (data) =>
      createRecord(User, { ...data, mediaId: data.mediaId as string })
    );
  }

  async update(
    id: string,
    data: Partial<
      IBaseUser & {
        interests: { added: string[]; deleted: string[] };
        hasOnboarded: boolean;
      }
    >
  ) {
    return validateUserUpdate(data, async (validData) => {
      const { data: userData } = await this._getByIdNoCache(id);

      if (isEmpty(userData)) throw new NotFoundError("User not found");

      const { interests, hasOnboarded, username, ...rest } = validData;

      const newInterests = [...(interests?.added || [])] as string[];
      const deletedInterests = [...(interests?.deleted || [])] as string[];

      const newInterestsSet = new Set(newInterests);
      const deletedInterestsSet = new Set(deletedInterests);

      const previousInterests = new Set([...(userData.meta?.interests || [])]);

      deletedInterestsSet.forEach((interest) => {
        newInterestsSet.delete(interest);
        previousInterests.delete(interest);
      });

      const newMeta = {
        ...userData.meta,
        hasOnboarded: hasOnboarded ?? userData.meta?.hasOnboarded,
        interests: [
          ...Array.from(newInterestsSet),
          ...Array.from(previousInterests),
        ],
      };

      const hasInterestsChanged =
        newInterests.length > 0 || deletedInterests.length > 0;

      if (hasInterestsChanged) {
        await deleteUserInterestsCache(id);
      }

      const isUsernameChanged = username && username !== userData.username;
      if (isUsernameChanged) {
        const { data: usernameData, error: usernameError } =
          await this.getUserByUsername(username);
        if (usernameError) throw new BadRequestError(usernameError.message);
        if (usernameData) throw new BadRequestError("Username already exists");
      }

      const promises: Promise<any>[] = [
        updateRecord(User, id, {
          ...rest,
          meta: newMeta,
          username,
          mediaId: rest.mediaId as string,
        }),
      ];

      if (rest.mediaId) {
        promises.push(this.mediaService.getById(rest.mediaId as string));
      }

      const results = await Promise.all(promises);

      const updatedUser = results[0].data as IBaseUser;

      await this.deleteCache(id);

      if (rest.mediaId) {
        updatedUser.media = results[1].data;
      }

      return {
        data: updatedUser,
        error: results[0]?.error || results[1]?.error,
      };
    });
  }

  @MethodCacheSync<IBaseUser>({})
  async getById(id: string): Promise<{ data: IBaseUser; error: any }> {
    const { data, error } = await findById(User, id);
    if (error) throw error;
    if (data.mediaId) {
      const { data: mediaData, error: mediaError } =
        await this.mediaService.getById(data.mediaId as string);
      if (mediaError) throw mediaError;
      data.media = mediaData;
    }

    return { data, error: null };
  }

  @MethodCacheSync<IBaseUser>({
    cacheGetter: getUserCacheByEmail,
    cacheSetter: setUserCacheByEmail,
  })
  async getUserByEmail(email: string) {
    const { data } = await findAllWithPagination(User, { email }, { limit: 1 });
    if (data.items.length === 0) return { data: null, error: null };
    return { data: data.items[0], error: null };
  }

  @MethodCacheSync<IBaseUser>({
    cacheGetter: getUserCacheByUsername,
    cacheSetter: setUserCacheByUsername,
  })
  getUserByUsername(username: string) {
    return findAllWithPagination(User, { username }, { limit: 1 });
  }

  @MethodCacheSync<IBaseUser>({
    cacheDeleter: deleteAllUserCache,
  })
  delete(id: string) {
    return deleteRecord(User, id);
  }

  @MethodCacheSync<ITag[]>({
    cacheGetter: getUserInterestsCache,
    cacheSetter: setUserInterestsCache,
    cacheDeleter: deleteUserInterestsCache,
  })
  async getUserInterests(id: string) {
    const user = await this.getById(id);
    if (isEmpty(user)) throw new NotFoundError("User not found");

    const { interests } = user.data.meta;

    if (isEmpty(interests)) return { data: [], error: null };

    const tags = await this.tagService.getAll({ id: interests });

    return { data: tags.data.items, error: tags.error };
  }

  async getUserProfiles(ids: string[]): Promise<{
    data: Record<string, IBaseUser>;
    error: any;
  }> {
    let fetchedUsers = await bulkGetUserCache(ids);

    if (fetchedUsers.length !== ids.length) {
      // find the users that are not in the cache
      const usersToFetch = new Set(ids);
      fetchedUsers.forEach((user) => {
        usersToFetch.delete(user.id);
      });

      const toFetchIds = Array.from(usersToFetch);

      const { data: users, error: usersError } = await this.getAll(
        { id: toFetchIds },
        { limit: toFetchIds.length }
      );

      if (usersError) throw usersError;
      await bulkSetUserCache(users.items);
      fetchedUsers = [...fetchedUsers, ...users.items];
    }

    const mediaIds = fetchedUsers.reduce((acc, user) => {
      if (user.mediaId) acc.push(user.mediaId as string);
      return acc;
    }, [] as string[]);

    const { data: mediaData } = await this.mediaService.getMediaByIds(mediaIds);

    const safeUsers = fetchedUsers.reduce((acc, user) => {
      acc[user.id] = getLeanUser({
        ...user,
        mediaId: mediaData[user.mediaId as string],
      });

      return acc;
    }, {} as Record<string, IBaseUser>);

    return { data: safeUsers, error: null };
  }

  /**
   * Retrieves user profiles by their IDs, with caching support and media population
   * @param {Array<T>} data - Array of items to fetch user profiles for
   * @param {keyof T} searchKey - Key to search for user IDs in the data
   * @param {keyof T} [populateKey] - Optional key to populate the user profile in the data
   * @returns {Promise<Array<T>>} Array of items with user profiles populated
   */
  async getAndPopulateUserProfiles<T extends Record<string, any>>(
    data: Array<T>,
    searchKey: keyof T,
    populateKey?: keyof T
  ): Promise<Array<T>> {
    const ids = data.map((item) => item[searchKey]);
    const { data: users, error: usersError } = await this.getUserProfiles(ids);
    if (usersError) throw usersError;

    return data.map((item) => {
      const user = users[item[searchKey]];
      if (!user) return item;
      return {
        ...item,
        [populateKey ?? searchKey]: users[item[searchKey]],
      };
    });
  }
}

export default UserService;
