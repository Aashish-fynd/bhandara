import { EQueryOperator } from "@definitions/enums";
import {
  IRequestPagination,
  ICustomRequest,
  IBaseUser,
} from "@definitions/types";
import { getSafeUser } from "./helpers";
import UserService from "./service";
import { Response } from "express";
import { isEmpty, omit } from "@utils";
import { NotFoundError } from "@exceptions";

const userService = new UserService();

export const getAllUser = async (
  req: IRequestPagination & ICustomRequest,
  res: Response
) => {
  const { self = "false", email } = req.query;

  let query = [];
  if (self !== "true") {
    query = [
      { column: "id", operator: EQueryOperator.Neq, value: req.user.id },
    ];
  }

  if (email) {
    query = [{ column: "email", operator: EQueryOperator.Eq, value: email }];
  }

  const { data } = await userService.getAll({ query }, req.pagination);

  const safeUsers = data?.items.map((user) => getSafeUser(user));
  return res.status(200).json({
    data: {
      items: safeUsers,
      pagination: data?.pagination,
    },
    error: null,
  });
};

export const getUserById = async (req: ICustomRequest, res: Response) => {
  const { id } = req.params;
  const { data } = await userService.getById(id);
  if (isEmpty(data)) throw new NotFoundError("User not found");
  return res.status(200).json({ data: getSafeUser(data), error: null });
};

export const deleteUser = async (req: ICustomRequest, res: Response) => {
  const { id } = req.params;
  const { data } = await userService.delete(id);
  return res.status(200).json({ data: getSafeUser(data), error: null });
};

export const updateUser = async (req: ICustomRequest, res: Response) => {
  const { id } = req.params;
  const updateBody = omit(req.body, ["password", "email"]);
  const { data } = await userService.update(id, updateBody);
  return res.status(200).json({ data: getSafeUser(data), error: null });
};

export const getUserByQuery = async (req: ICustomRequest, res: Response) => {
  const { email, username } = req.query;

  let data: IBaseUser | null = null;

  if (email) {
    const { data: emailData } = await userService.getUserByEmail(
      email as string
    );
    if (isEmpty(emailData)) throw new NotFoundError("User not found");
    data = emailData;
  }

  if (username) {
    const { data: usernameData } = await userService.getUserByUsername(
      username as string
    );
    if (isEmpty(usernameData)) throw new NotFoundError("User not found");
    data = usernameData;
  }

  return res.status(200).json({ data: getSafeUser(data), error: null });
};
