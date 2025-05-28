import { IBaseUser, ITag } from "@/definitions/types";
import Base from "../Base";
import { validateUserCreate, validateUserUpdate } from "./validation";
import { EQueryOperator } from "@/definitions/enums";
import { USER_TABLE_NAME } from "./constants";
import { PostgrestError } from "@supabase/supabase-js";
import { deleteUserCache, getUserCache, setUserCache } from "./helpers";
import { MethodCacheSync } from "@decorators";
import { NotFoundError } from "@exceptions";
import { isEmpty } from "@utils";

class UserService extends Base<IBaseUser> {
  private readonly getCache = getUserCache;
  private readonly setCache = setUserCache;
  private readonly deleteCache = deleteUserCache;

  constructor() {
    super(USER_TABLE_NAME);
  }

  async _getByIdNoCache(id: string) {
    return super.getById(id);
  }

  @MethodCacheSync<IBaseUser>()
  async create(
    data: Partial<IBaseUser>
  ): Promise<{ data: IBaseUser[] | null; error: PostgrestError | null }> {
    return validateUserCreate(data, (data) => super.create(data));
  }

  async update(
    id: string,
    data: Partial<IBaseUser & { interests: ITag[]; hasOnboarded: boolean }>
  ) {
    return validateUserUpdate(data, async (validData) => {
      const { data: userData } = await this._getByIdNoCache(id);

      if (isEmpty(userData)) throw new NotFoundError("User not found");

      const { interests, hasOnboarded, ...rest } = validData;
      const newMeta = {
        ...userData.meta,
        hasOnboarded,
        interests: [
          ...new Set([
            ...(userData.meta?.interests || []),
            ...(interests || []),
          ]),
        ],
      };

      const res = await super.update(id, { ...rest, meta: newMeta });

      await this.setCache(id, res.data);

      return res;
    });
  }

  @MethodCacheSync<IBaseUser>({
    cacheSetter: async (id: string, data: IBaseUser) => {
      await Promise.all([
        setUserCache(id, data),
        setUserCache(data.email, data),
      ]);
      return "OK";
    },
  })
  async getById(
    id: string
  ): Promise<{ data: IBaseUser; error: PostgrestError | null }> {
    return super.getById(id);
  }

  @MethodCacheSync<IBaseUser>()
  getUserByEmail(email: string) {
    return this._supabaseService.querySupabase({
      table: USER_TABLE_NAME,
      query: [
        {
          column: "email",
          operator: EQueryOperator.Eq,
          value: email,
        },
      ],
      modifyQuery: (qb) => qb.maybeSingle(),
    }) as Promise<{ data: IBaseUser | null; error: PostgrestError | null }>;
  }
  @MethodCacheSync<IBaseUser>()
  getUserByUsername(username: string) {
    return this._supabaseService.querySupabase({
      table: USER_TABLE_NAME,
      query: [
        {
          column: "username",
          operator: EQueryOperator.Eq,
          value: username,
        },
      ],
      modifyQuery: (qb) => qb.maybeSingle(),
    }) as Promise<{ data: IBaseUser | null; error: PostgrestError | null }>;
  }

  @MethodCacheSync<IBaseUser>({
    cacheDeleter: (id: string, existingData: IBaseUser) =>
      Promise.all([deleteUserCache(id), deleteUserCache(existingData.email)]),
  })
  delete(id: string) {
    return super.delete(id);
  }
}

export default UserService;
