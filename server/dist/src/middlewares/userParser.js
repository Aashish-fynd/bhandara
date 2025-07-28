import { NotFoundError } from "@exceptions";
import asyncHandler from "./asyncHandler";
import { getSafeUser, getUserCache, MediaService, setUserCache, UserService, } from "@features";
import { isEmpty } from "@utils";
const userService = new UserService();
const mediaService = new MediaService();
const userParser = async (req, res, next) => {
    let user = await getUserCache(req.session.user.id);
    if (!user) {
        const data = await userService.getById(req.session.user.id);
        if (isEmpty(data))
            throw new NotFoundError("User not found");
        await setUserCache(req.session.user.id, data);
        user = data;
    }
    req.user = getSafeUser(user);
    return next();
};
export default asyncHandler(userParser);
//# sourceMappingURL=userParser.js.map