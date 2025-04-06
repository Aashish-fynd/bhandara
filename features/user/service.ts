import { IBaseUser } from "@/definitions/types/global";
import Base from "../Base";
import { validateUserCreate, validateUserUpdate } from "./validation";
import { EQueryOperator } from "@/definitions/enums";

class UserService extends Base<IBaseUser> {
  public static readonly TABLE_NAME = "User";
  constructor() {
    super(UserService.TABLE_NAME);
  }

  async create<U extends Partial<Omit<IBaseUser, "id" | "updatedAt">>>(
    data: U,
    useTransaction?: boolean
  ) {
    return validateUserCreate(data, (data) =>
      super.create(data, useTransaction)
    );
  }

  async update<U extends Partial<IBaseUser>>(id: string, data: U) {
    return validateUserUpdate(data, (data) => super.update(id, data));
  }

  getUserByEmail(email: string) {
    return this.supabaseService.querySupabase({
      table: UserService.TABLE_NAME,
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
