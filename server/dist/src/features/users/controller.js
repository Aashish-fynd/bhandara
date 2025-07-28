import { EQueryOperator } from "@definitions/enums";
import { getSafeUser } from "./helpers";
import UserService from "./service";
import { isEmpty, omit } from "@utils";
import { NotFoundError } from "@exceptions";
const userService = new UserService();
export const getAllUser = async (req, res) => {
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
    const { items, pagination: dataPagination } = await userService.getAll({ query }, req.pagination);
    const safeUsers = items?.map((user) => getSafeUser(user));
    return res.status(200).json({
        data: {
            items: safeUsers,
            pagination: dataPagination,
        },
    });
};
export const getUserById = async (req, res) => {
    const { id } = req.params;
    const data = await userService.getById(id);
    if (isEmpty(data))
        throw new NotFoundError("User not found");
    return res.status(200).json({ data: getSafeUser(data) });
};
export const deleteUser = async (req, res) => {
    const { id } = req.params;
    const data = (await userService.delete(id));
    return res.status(200).json({ data: getSafeUser(data) });
};
export const updateUser = async (req, res) => {
    const { id } = req.params;
    const updateBody = omit(req.body, ["password", "email"]);
    const data = await userService.update(id, updateBody);
    return res.status(200).json({ data: getSafeUser(data) });
};
export const getUserByQuery = async (req, res) => {
    const { email, username } = req.query;
    let data = null;
    if (email) {
        const emailData = await userService.getUserByEmail(email);
        data = emailData;
    }
    else if (username) {
        const usernameData = await userService.getUserByUsername(username);
        data = usernameData.items?.[0];
    }
    if (isEmpty(data))
        throw new NotFoundError("User not found");
    return res.status(200).json({ data: getSafeUser(data) });
};
export const getUserInterests = async (req, res) => {
    const { id } = req.params;
    const data = await userService.getUserInterests(id);
    return res.status(200).json({ data });
};
//# sourceMappingURL=controller.js.map