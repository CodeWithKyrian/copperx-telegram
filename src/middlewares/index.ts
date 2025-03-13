import { Telegraf } from "telegraf";
import { createSessionMiddleware, updateSessionMiddleware } from "./session.middleware";
import { loggerMiddleware } from "./logger.middleware";
import { createAuthMiddleware } from "./auth.middleware";
import { apiClientMiddleware } from "./api-client.middleware";
import { GlobalContext } from "../types";

export const configureMiddlewares = (bot: Telegraf<GlobalContext>) => {
    // Register middlewares in order of execution
    bot.use(loggerMiddleware());

    // Session must be before auth since auth depends on session
    bot.use(createSessionMiddleware());
    bot.use(updateSessionMiddleware());

    // Add authentication middleware
    bot.use(createAuthMiddleware());

    // Set up API client with user's token
    bot.use(apiClientMiddleware());
};