import { Telegraf } from "telegraf";
import { loggerMiddleware } from "./logger.middleware";
import { createAuthMiddleware } from "./auth.middleware";
import { createSessionMiddleware, updateSessionMiddleware } from "./session.middleware";
import { GlobalContext } from "../types";

export const configureMiddlewares = (bot: Telegraf<GlobalContext>) => {
    bot.use(loggerMiddleware());

    bot.use(createSessionMiddleware());

    bot.use(createAuthMiddleware());

    bot.use(updateSessionMiddleware());
};