import { Telegraf } from "telegraf";
import { sessionMiddleware } from "./session.middleware";
import { loggerMiddleware } from "./logger.middleware";
import { authMiddleware } from "./auth.middleware";
import { apiClientMiddleware } from "./api-client.middleware";
import { rateLimitMiddleware } from "./rate-limit.middleware";
import { GlobalContext } from "../types";


export const configureMiddlewares = (bot: Telegraf<GlobalContext>) => {
    // Register middlewares in order of execution
    bot.use(loggerMiddleware());

    // Session must be before auth since auth depends on session
    bot.use(sessionMiddleware());

    bot.use(rateLimitMiddleware());

    bot.use(authMiddleware());

    bot.use(apiClientMiddleware());
};