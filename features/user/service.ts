import { IBaseUser } from "@/definitions/types/global";
import Base from "../Base";
import { validateUserCreate, validateUserUpdate } from "./validation";
import { EQueryOperator } from "@/definitions/enums";
import { USER_TABLE_NAME } from "./constants";
// import { RedisCache } from "../cache";
class UserService extends Base<IBaseUser> {
  // redisCache: RedisCache;
  constructor() {
    super(USER_TABLE_NAME);
    // this.redisCache = new RedisCache({ cacheNamespace: "users" });
  }

  async create<U extends Partial<Omit<IBaseUser, "id" | "updatedAt">>>(data: U, useTransaction?: boolean) {
    return validateUserCreate(data, (data) => super.create(data, useTransaction));
  }

  async update<U extends Partial<IBaseUser>>(id: string, data: U) {
    return validateUserUpdate(data, (data) => super.update(id, data));
  }

  getUserByEmail(email: string) {
    return this.supabaseService.querySupabase({
      table: USER_TABLE_NAME,
      query: [
        {
          column: "email",
          operator: EQueryOperator.Eq,
          value: email
        }
      ]
    });
  }
}

export default UserService;
