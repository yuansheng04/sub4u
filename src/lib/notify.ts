const NOTIFY_URL = process.env.NOTIFY_URL || "";

export async function sendNotification(message: string) {
  if (!NOTIFY_URL) return;

  try {
    // 支持 Bark / Telegram / 任意 webhook
    if (NOTIFY_URL.includes("api.telegram.org")) {
      // Telegram: NOTIFY_URL = https://api.telegram.org/bot<TOKEN>/sendMessage?chat_id=<CHAT_ID>
      await fetch(NOTIFY_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: message }),
      });
    } else if (NOTIFY_URL.includes("api.day.app")) {
      // Bark: NOTIFY_URL = https://api.day.app/<KEY>
      await fetch(`${NOTIFY_URL}/Trade Station/${encodeURIComponent(message)}`);
    } else {
      // 通用 webhook POST
      await fetch(NOTIFY_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: message, content: message }),
      });
    }
  } catch {
    // 通知失败不影响登录流程
  }
}
