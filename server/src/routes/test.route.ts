import { supabase } from "@connections";
import { RequestContext } from "@contexts";
import { ICustomRequest } from "@definitions/types";
import { getUserSessionCacheList, RedisCache, UserService } from "@features";
import { sessionParser, userParser } from "@middlewares";
import { Router, Response } from "express";

const router = Router();

const redisCache = new RedisCache({ namespace: "test" });
const userService = new UserService();

router.get("/", [userParser], async (req, res) => {
  const redisData = await getUserSessionCacheList(req.user.id);
  res.json({ redisData });
});

router.get(
  "/user",
  [sessionParser, userParser],
  async (req: ICustomRequest, res: Response) => {}
);

export default router;
