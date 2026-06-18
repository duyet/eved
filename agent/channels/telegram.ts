import { telegramChannel, type TelegramMessageBody } from "eve/channels/telegram";
import { markdownToTelegramHtml } from "../lib/telegram-format.ts";

// Telegram bot channel for @evedx_bot.
//
// Credentials come from the environment:
//   TELEGRAM_BOT_TOKEN            — replies, typing, callbacks, proactive sends
//   TELEGRAM_WEBHOOK_SECRET_TOKEN — must match the secret_token set on setWebhook
//
// Register the webhook once against the deployed URL (eve does not call
// setWebhook for you):
//   curl -X POST "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/setWebhook" \
//     -d '{"url":"https://<host>/eve/v1/telegram",
//          "secret_token":"'"$TELEGRAM_WEBHOOK_SECRET_TOKEN"'",
//          "allowed_updates":["message","callback_query"]}'

export default telegramChannel({
  botUsername: "evedx_bot",
  uploadPolicy: {
    allowedMediaTypes: ["image/*", "application/pdf"],
    maxBytes: 10 * 1024 * 1024,
  },
  events: {
    // The default handler sends plain text with no parse mode, so Markdown leaks
    // through literally. Render it to Telegram HTML so replies get real bold,
    // italics, links, lists, and code blocks. Interim tool-call narration
    // (finishReason === "tool-calls") is suppressed, same as the default.
    async "message.completed"(data, channel) {
      if (data.finishReason === "tool-calls" || !data.message) return;
      const html = markdownToTelegramHtml(data.message);
      const body = {
        text: html,
        parse_mode: "HTML",
        link_preview_options: { is_disabled: true },
      };
      await channel.telegram.post(body as unknown as TelegramMessageBody);
    },
  },
});
