import { IBaseUser } from "@/definitions/types";
import Base from "../Base";
import { validateUserCreate, validateUserUpdate } from "./validation";
import { EQueryOperator } from "@/definitions/enums";
import { USER_TABLE_NAME } from "./constants";
import { PostgrestError } from "@supabase/supabase-js";
import { deleteUserCache, getUserCache, setUserCache } from "./helpers";
import { SecureMethodCache } from "@decorators";

class UserService extends Base<IBaseUser> {
  private readonly getCache = getUserCache;
  private readonly setCache = setUserCache;
  private readonly deleteCache = deleteUserCache;

  constructor() {
    super(USER_TABLE_NAME);
  }

  @SecureMethodCache<IBaseUser>()
  async create(
    data: Partial<IBaseUser>
  ): Promise<{ data: IBaseUser[] | null; error: PostgrestError | null }> {
    return validateUserCreate(data, (data) => super.create(data));
  }

  @SecureMethodCache<IBaseUser>()
  async update(id: string, data: Partial<IBaseUser>) {
    return validateUserUpdate(data, async (validData) =>
      super.update(id, validData)
    );
  }

  @SecureMethodCache<IBaseUser>()
  async getById(
    id: string
  ): Promise<{ data: IBaseUser; error: PostgrestError | null }> {
    const cachedUser = await getUserCache(id);
    if (cachedUser) return { data: cachedUser, error: null };
    const res = await super.getById(id);
    if (res.data) await setUserCache(res.data.email, res.data);
    return res;
  }

  @SecureMethodCache<IBaseUser>()
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

  @SecureMethodCache<IBaseUser>({
    cacheDeleter: (id: string, existingData: IBaseUser) =>
      Promise.all([deleteUserCache(id), deleteUserCache(existingData.email)]),
  })
  delete(id: string) {
    return super.delete(id);
  }
}

export default UserService;
