// Static mapping: service name (lowercase) → domain
// Used to resolve favicons when URL is not provided
const SERVICE_MAP: Record<string, string> = {
  // — AI —
  "chatgpt": "openai.com",
  "openai": "openai.com",
  "claude": "anthropic.com",
  "anthropic": "anthropic.com",
  "midjourney": "midjourney.com",
  "copilot": "github.com",
  "gemini": "gemini.google.com",
  "perplexity": "perplexity.ai",
  "poe": "poe.com",
  "cursor": "cursor.com",
  "windsurf": "codeium.com",
  "jasper": "jasper.ai",
  "runway": "runwayml.com",
  "suno": "suno.com",
  "udio": "udio.com",
  // — 流媒体 / 视频 —
  "netflix": "netflix.com",
  "disney+": "disneyplus.com",
  "disney plus": "disneyplus.com",
  "hbo": "hbomax.com",
  "hbo max": "hbomax.com",
  "hulu": "hulu.com",
  "youtube": "youtube.com",
  "youtube premium": "youtube.com",
  "youtube music": "music.youtube.com",
  "prime video": "primevideo.com",
  "amazon prime": "amazon.com",
  "apple tv+": "tv.apple.com",
  "apple tv": "tv.apple.com",
  "crunchyroll": "crunchyroll.com",
  "paramount+": "paramountplus.com",
  "peacock": "peacocktv.com",
  "twitch": "twitch.tv",
  // — 音乐 —
  "spotify": "spotify.com",
  "apple music": "music.apple.com",
  "tidal": "tidal.com",
  "deezer": "deezer.com",
  "soundcloud": "soundcloud.com",
  // — 云存储 / 工具 —
  "icloud": "icloud.com",
  "icloud+": "icloud.com",
  "google one": "one.google.com",
  "google drive": "drive.google.com",
  "dropbox": "dropbox.com",
  "onedrive": "onedrive.live.com",
  "notion": "notion.so",
  "obsidian": "obsidian.md",
  "evernote": "evernote.com",
  "1password": "1password.com",
  "bitwarden": "bitwarden.com",
  "lastpass": "lastpass.com",
  "dashlane": "dashlane.com",
  "todoist": "todoist.com",
  "trello": "trello.com",
  "slack": "slack.com",
  "zoom": "zoom.us",
  "canva": "canva.com",
  "figma": "figma.com",
  "adobe": "adobe.com",
  "photoshop": "adobe.com",
  "lightroom": "adobe.com",
  "creative cloud": "adobe.com",
  "grammarly": "grammarly.com",
  "linear": "linear.app",
  "vercel": "vercel.com",
  "netlify": "netlify.com",
  "heroku": "heroku.com",
  "railway": "railway.app",
  "supabase": "supabase.com",
  "planetscale": "planetscale.com",
  // — 开发 —
  "github": "github.com",
  "gitlab": "gitlab.com",
  "bitbucket": "bitbucket.org",
  "jetbrains": "jetbrains.com",
  "docker": "docker.com",
  "npm": "npmjs.com",
  "digitalocean": "digitalocean.com",
  "aws": "aws.amazon.com",
  "azure": "azure.microsoft.com",
  "cloudflare": "cloudflare.com",
  // — 云服务 / VPS —
  "vultr": "vultr.com",
  "linode": "linode.com",
  "bandwagon": "bandwagonhost.com",
  "bandwagonhost": "bandwagonhost.com",
  "搬瓦工": "bandwagonhost.com",
  "vmiss": "vmiss.com",
  "racknerd": "racknerd.com",
  "hostdare": "hostdare.com",
  "dmit": "dmit.io",
  // — VPN / 代理 —
  "nordvpn": "nordvpn.com",
  "expressvpn": "expressvpn.com",
  "surfshark": "surfshark.com",
  "mullvad": "mullvad.net",
  "protonvpn": "protonvpn.com",
  "proton": "proton.me",
  "proton mail": "proton.me",
  // — 购物 / 会员 —
  "amazon": "amazon.com",
  "costco": "costco.com",
  "walmart": "walmart.com",
  "ebay": "ebay.com",
  // — 社交 —
  "twitter": "x.com",
  "x": "x.com",
  "x premium": "x.com",
  "reddit": "reddit.com",
  "discord": "discord.com",
  "discord nitro": "discord.com",
  "telegram": "telegram.org",
  "telegram premium": "telegram.org",
  // — 游戏 —
  "xbox": "xbox.com",
  "xbox game pass": "xbox.com",
  "playstation": "playstation.com",
  "ps plus": "playstation.com",
  "nintendo": "nintendo.com",
  "nintendo switch online": "nintendo.com",
  "steam": "store.steampowered.com",
  "epic games": "epicgames.com",
  "ea play": "ea.com",
  // — 阅读 —
  "kindle": "amazon.com",
  "kindle unlimited": "amazon.com",
  "audible": "audible.com",
  "medium": "medium.com",
  "substack": "substack.com",
  // — 健身 —
  "strava": "strava.com",
  "peloton": "onepeloton.com",
  // ===== 国内服务 =====
  // — 视频 —
  "爱奇艺": "iqiyi.com",
  "优酷": "youku.com",
  "腾讯视频": "v.qq.com",
  "芒果tv": "mgtv.com",
  "芒果TV": "mgtv.com",
  "哔哩哔哩": "bilibili.com",
  "bilibili": "bilibili.com",
  "b站": "bilibili.com",
  "B站": "bilibili.com",
  "b站大会员": "bilibili.com",
  // — 音乐 —
  "网易云音乐": "music.163.com",
  "网易云": "music.163.com",
  "qq音乐": "y.qq.com",
  "QQ音乐": "y.qq.com",
  "酷狗音乐": "kugou.com",
  "酷我音乐": "kuwo.cn",
  "汽水音乐": "qishui.douyin.com",
  // — 购物 / 会员 —
  "淘宝": "taobao.com",
  "天猫": "tmall.com",
  "88vip": "taobao.com",
  "88VIP": "taobao.com",
  "京东": "jd.com",
  "京东plus": "jd.com",
  "京东PLUS": "jd.com",
  "拼多多": "pinduoduo.com",
  "美团": "meituan.com",
  "饿了么": "ele.me",
  "盒马": "freshhema.com",
  // — 出行 —
  "滴滴": "didiglobal.com",
  "高德": "amap.com",
  "携程": "ctrip.com",
  "飞猪": "fliggy.com",
  "去哪儿": "qunar.com",
  "12306": "12306.cn",
  // — 工具 / 云 —
  "百度网盘": "pan.baidu.com",
  "百度云": "pan.baidu.com",
  "阿里云盘": "alipan.com",
  "夸克网盘": "quark.cn",
  "腾讯云": "cloud.tencent.com",
  "阿里云": "aliyun.com",
  "华为云": "huaweicloud.com",
  "wps": "wps.cn",
  "WPS": "wps.cn",
  "印象笔记": "yinxiang.com",
  "有道云笔记": "note.youdao.com",
  "坚果云": "jianguoyun.com",
  "石墨文档": "shimo.im",
  "语雀": "yuque.com",
  "飞书": "feishu.cn",
  "钉钉": "dingtalk.com",
  "企业微信": "work.weixin.qq.com",
  // — 社交 / 通讯 —
  "微信": "weixin.qq.com",
  "微博": "weibo.com",
  "知乎": "zhihu.com",
  "知乎盐选": "zhihu.com",
  "豆瓣": "douban.com",
  "小红书": "xiaohongshu.com",
  "抖音": "douyin.com",
  "快手": "kuaishou.com",
  // — 阅读 —
  "微信读书": "weread.qq.com",
  "得到": "dedao.cn",
  "喜马拉雅": "ximalaya.com",
  "樊登读书": "dushu.io",
  // — 投资 / 金融 —
  "同花顺": "10jqka.com.cn",
  "东方财富": "eastmoney.com",
  "雪球": "xueqiu.com",
  "富途": "futunn.com",
  "富途牛牛": "futunn.com",
  "老虎证券": "itigerup.com",
  "tradingview": "tradingview.com",
  // — 安全 / VPN —
  "clash": "clash.wiki",
  "surge": "nssurge.com",
  "quantumult": "quantumult.com",
  "shadowrocket": "shadowrocket.com",
  "flower": "flower.anfora.app",
  // — 教育 —
  "多邻国": "duolingo.com",
  "duolingo": "duolingo.com",
  "coursera": "coursera.org",
  "udemy": "udemy.com",
  // — 其他 —
  "苹果": "apple.com",
  "apple": "apple.com",
  "apple one": "apple.com",
  "microsoft 365": "microsoft.com",
  "microsoft": "microsoft.com",
  "office 365": "microsoft.com",
  "google": "google.com",
  "google workspace": "workspace.google.com",
};

/**
 * Resolve a domain from service name.
 * 1. Exact match in map (case-insensitive)
 * 2. Partial match (map key contained in name, or name contained in map key)
 * 3. Guess: name.com (only for ASCII names)
 */
export function resolveDomain(name: string): string | null {
  const lower = name.toLowerCase().trim();
  if (!lower) return null;

  // Exact match
  if (SERVICE_MAP[lower]) return SERVICE_MAP[lower];

  // Partial match: find the best (longest key) that is contained in the input
  let bestMatch: string | null = null;
  let bestLen = 0;
  for (const [key, domain] of Object.entries(SERVICE_MAP)) {
    if (lower.includes(key) && key.length > bestLen) {
      bestMatch = domain;
      bestLen = key.length;
    }
  }
  if (bestMatch) return bestMatch;

  // Guess: for ASCII-only names, try name.com
  if (/^[a-z0-9][a-z0-9. -]*$/.test(lower)) {
    const slug = lower.replace(/[\s.+-]+/g, "");
    return `${slug}.com`;
  }

  return null;
}
