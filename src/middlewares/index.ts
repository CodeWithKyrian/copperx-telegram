import { Telegraf } from "telegraf";
import { createSessionMiddleware, updateSessionMiddleware } from "./session.middleware";
import { loggerMiddleware } from "./logger.middleware";
import { GlobalContext } from "../types";

export const configureMiddlewares = (bot: Telegraf<GlobalContext>) => {
    bot.use(loggerMiddleware());

    bot.use(createSessionMiddleware());

    bot.use(updateSessionMiddleware());
};