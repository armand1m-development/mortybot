import { CommandMiddleware } from "grammy/composer.ts";
import { BotContext } from "/src/context/mod.ts";
import { getRandomValue } from "/src/utilities/array/random.ts";

const table: Record<string, string[] | undefined> = {
  "&": "⅋".split(""),
  "%": ["⅍", "℀", "℁", "℆", "℅"],
  "0": ["０", "Ѳ", "ʘ"],
  "1": ["➀", "❶", "１"],
  "2": ["２", "❷", "➁"],
  "3": ["３", "❸", "➂"],
  "4": ["４", "❹", "➃"],
  "5": ["❺", "➄", "５"],
  "6": ["６", "❻", "➅"],
  "7": ["７", "❼", "➆"],
  "8": ["８", "➇", "❽"],
  "9": ["➈", "❾", "９"],
  "<": [
    "≼",
    "≺",
    "≪",
    "☾",
    "≾",
    "⋜",
    "⋞",
    "⋐",
    "⊂",
    "⊏",
    "⊑",
    "《",
    "＜",
    "❮",
    "❰",
    "⫷",
  ],
  ">": "☽≫≻≽≿⋝⋟⋑⊃⊐⊒⫸》＞❯❱".split(""),
  "[": "【〖〘〚［".split(""),
  "]": "】〗〙〛］".split(""),
  "*": "✨✩✪✫✬✭✮✯✰✦✱✲✳✴✵✶✷֍֎✸✹✺✻✼✽✾✿❀❁❂❃❄★☆＊".split(""),
  "a": [
    "Ⓐ",
    "ⓐ",
    "α",
    "Ａ",
    "ａ",
    "ᗩ",
    "卂",
    "Δ",
    "ค",
    "α",
    "ά",
    "Ã",
    "𝔞",
    "𝓪",
    "𝒶",
    "𝓐",
    "𝐀",
    "𝐚",
    "𝔸",
    "𝕒",
    "ᵃ",
  ],
  "b": [
    "Ⓑ",
    "ⓑ",
    "в",
    "Ｂ",
    "乃",
    "ｂ",
    "ᗷ",
    "β",
    "๒",
    "в",
    "в",
    "β",
    "𝔟",
    "𝓫",
    "𝒷",
    "𝓑",
    "𝐁",
    "𝐛",
    "𝔹",
    "𝕓",
    "ᵇ",
  ],
  "c": [
    "Ⓒ",
    "ⓒ",
    "匚",
    "¢",
    "Ｃ",
    "ｃ",
    "ᑕ",
    "Ć",
    "ς",
    "c",
    "ς",
    "Č",
    "℃",
    "𝔠",
    "𝓬",
    "𝒸",
    "𝓒",
    "𝐂",
    "𝐜",
    "ℂ",
    "𝕔",
    "ᶜ",
  ],
  "d": [
    "Ⓓ",
    "ⓓ",
    "∂",
    "Ｄ",
    "ｄ",
    "ᗪ",
    "Đ",
    "๔",
    "∂",
    "đ",
    "Ď",
    "𝔡",
    "𝓭",
    "𝒹",
    "𝓓",
    "𝐃",
    "ᗪ",
    "𝐝",
    "𝔻",
    "𝕕",
    "ᵈ",
  ],
  "e": [
    "Ⓔ",
    "乇",
    "ⓔ",
    "є",
    "Ｅ",
    "ｅ",
    "ᗴ",
    "€",
    "є",
    "ε",
    "έ",
    "Ẹ",
    "𝔢",
    "𝒆",
    "𝑒",
    "𝓔",
    "𝐄",
    "𝐞",
    "𝔼",
    "𝕖",
    "ᵉ",
  ],
  "f": [
    "Ⓕ",
    "ⓕ",
    "ƒ",
    "Ｆ",
    "ｆ",
    "千",
    "ᖴ",
    "ℱ",
    "Ŧ",
    "ғ",
    "ғ",
    "Ƒ",
    "𝔣",
    "𝒇",
    "𝒻",
    "𝓕",
    "𝐅",
    "𝐟",
    "𝔽",
    "𝕗",
    "ᶠ",
  ],
  "g": [
    "Ⓖ",
    "ⓖ",
    "ق",
    "g",
    "Ｇ",
    "ｇ",
    "Ǥ",
    "Ꮆ",
    "ﻮ",
    "g",
    "ģ",
    "Ğ",
    "𝔤",
    "𝓰",
    "𝑔",
    "𝓖",
    "𝐆",
    "𝐠",
    "𝔾",
    "𝕘",
    "ᵍ",
    "Ꮆ",
  ],
  "h": [
    "Ⓗ",
    "卄",
    "ⓗ",
    "н",
    "Ｈ",
    "ｈ",
    "ᕼ",
    "Ħ",
    "ђ",
    "н",
    "ħ",
    "Ĥ",
    "𝔥",
    "𝓱",
    "𝒽",
    "𝓗",
    "𝐇",
    "𝐡",
    "ℍ",
    "𝕙",
    "ʰ",
  ],
  "i": [
    "Ⓘ",
    "ⓘ",
    "ι",
    "Ｉ",
    "ｉ",
    "Ꭵ",
    "丨",
    "Ɨ",
    "เ",
    "ι",
    "ί",
    "Į",
    "𝔦",
    "𝓲",
    "𝒾",
    "𝓘",
    "𝐈",
    "𝐢",
    "𝕀",
    "𝕚",
    "ᶤ",
  ],
  "j": [
    "Ⓙ",
    "ⓙ",
    "נ",
    "Ｊ",
    "ڶ",
    "ｊ",
    "ᒎ",
    "Ĵ",
    "ן",
    "נ",
    "ј",
    "Ĵ",
    "𝔧",
    "𝓳",
    "𝒿",
    "𝓙",
    "𝐉",
    "𝐣",
    "𝕁",
    "𝕛",
    "ʲ",
  ],
  "k": [
    "Ⓚ",
    "ⓚ",
    "к",
    "Ｋ",
    "ｋ",
    "ᛕ",
    "Ҝ",
    "к",
    "к",
    "ķ",
    "Ќ",
    "𝔨",
    "𝓴",
    "𝓀",
    "𝓚",
    "𝐊",
    "𝐤",
    "𝕂",
    "𝕜",
    "ᵏ",
    "Ҝ",
  ],
  "l": [
    "Ⓛ",
    "ⓛ",
    "ℓ",
    "ㄥ",
    "Ｌ",
    "ｌ",
    "ᒪ",
    "Ł",
    "l",
    "ℓ",
    "Ļ",
    "Ĺ",
    "𝔩",
    "𝓵",
    "𝓁",
    "𝓛",
    "𝐋",
    "𝐥",
    "𝕃",
    "𝕝",
    "ˡ",
  ],
  "m": [
    "Ⓜ",
    "ⓜ",
    "м",
    "Ｍ",
    "ｍ",
    "ᗰ",
    "Μ",
    "๓",
    "м",
    "м",
    "ϻ",
    "𝔪",
    "𝓶",
    "𝓂",
    "𝓜",
    "𝐌",
    "𝐦",
    "𝕄",
    "𝕞",
    "ᵐ",
    "爪",
  ],
  "n": [
    "Ⓝ",
    "几",
    "ⓝ",
    "η",
    "Ｎ",
    "ｎ",
    "ᑎ",
    "Ň",
    "ภ",
    "η",
    "ή",
    "Ň",
    "𝔫",
    "𝓷",
    "𝓃",
    "𝓝",
    "𝐍",
    "𝐧",
    "ℕ",
    "𝕟",
    "ᶰ",
  ],
  "o": [
    "Ⓞ",
    "ㄖ",
    "ⓞ",
    "σ",
    "Ｏ",
    "ｏ",
    "ᗝ",
    "Ø",
    "๏",
    "σ",
    "ό",
    "Ỗ",
    "𝔬",
    "𝓸",
    "𝑜",
    "𝓞",
    "𝐎",
    "𝐨",
    "𝕆",
    "𝕠",
    "ᵒ",
  ],
  "p": [
    "Ⓟ",
    "ⓟ",
    "ρ",
    "Ｐ",
    "ｐ",
    "卩",
    "ᑭ",
    "Ƥ",
    "ק",
    "ρ",
    "ρ",
    "Ƥ",
    "𝔭",
    "𝓹",
    "𝓅",
    "𝓟",
    "𝐏",
    "𝐩",
    "ℙ",
    "𝕡",
    "ᵖ",
  ],
  "q": [
    "Ⓠ",
    "ⓠ",
    "q",
    "Ｑ",
    "ｑ",
    "Ɋ",
    "Ω",
    "ợ",
    "q",
    "q",
    "Ǫ",
    "𝔮",
    "𝓺",
    "𝓆",
    "𝓠",
    "𝐐",
    "𝐪",
    "ℚ",
    "𝕢",
    "ᵠ",
  ],
  "r": [
    "Ⓡ",
    "ⓡ",
    "я",
    "尺",
    "Ｒ",
    "ｒ",
    "ᖇ",
    "Ř",
    "г",
    "я",
    "ŕ",
    "Ř",
    "𝔯",
    "𝓻",
    "𝓇",
    "𝓡",
    "𝐑",
    "𝐫",
    "ℝ",
    "𝕣",
    "ʳ",
  ],
  "s": [
    "Ⓢ",
    "ⓢ",
    "ѕ",
    "Ｓ",
    "丂",
    "ｓ",
    "ᔕ",
    "Ş",
    "ร",
    "s",
    "ş",
    "Ŝ",
    "𝔰",
    "𝓼",
    "𝓈",
    "𝓢",
    "𝐒",
    "𝐬",
    "𝕊",
    "𝕤",
    "ˢ",
  ],
  "t": [
    "Ⓣ",
    "ⓣ",
    "т",
    "Ｔ",
    "ｔ",
    "丅",
    "Ŧ",
    "t",
    "т",
    "ţ",
    "Ť",
    "𝔱",
    "𝓽",
    "𝓉",
    "𝓣",
    "𝐓",
    "𝐭",
    "𝕋",
    "𝕥",
    "ᵗ",
  ],
  "u": [
    "Ⓤ",
    "ⓤ",
    "υ",
    "Ｕ",
    "ｕ",
    "ᑌ",
    "Ữ",
    "ย",
    "υ",
    "ù",
    "Ǘ",
    "𝔲",
    "𝓾",
    "𝓊",
    "𝓤",
    "𝐔",
    "𝐮",
    "𝕌",
    "𝕦",
    "ᵘ",
  ],
  "v": [
    "Ⓥ",
    "ⓥ",
    "ν",
    "Ｖ",
    "ｖ",
    "ᐯ",
    "V",
    "ש",
    "v",
    "ν",
    "Ѷ",
    "𝔳",
    "𝓿",
    "𝓋",
    "𝓥",
    "𝐕",
    "𝐯",
    "𝕍",
    "𝕧",
    "ᵛ",
  ],
  "w": [
    "Ⓦ",
    "ⓦ",
    "ω",
    "Ｗ",
    "ｗ",
    "ᗯ",
    "Ŵ",
    "ฬ",
    "ω",
    "ώ",
    "Ŵ",
    "𝔴",
    "𝔀",
    "𝓌",
    "𝓦",
    "𝐖",
    "𝐰",
    "𝕎",
    "𝕨",
    "ʷ",
    "山",
  ],
  "x": [
    "Ⓧ",
    "ⓧ",
    "χ",
    "Ｘ",
    "乂",
    "ｘ",
    "᙭",
    "Ж",
    "א",
    "x",
    "x",
    "Ж",
    "𝔵",
    "𝔁",
    "𝓍",
    "𝓧",
    "𝐗",
    "𝐱",
    "𝕏",
    "𝕩",
    "ˣ",
  ],
  "y": [
    "Ⓨ",
    "ㄚ",
    "ⓨ",
    "у",
    "Ｙ",
    "ｙ",
    "Ƴ",
    "¥",
    "ץ",
    "ү",
    "ч",
    "Ў",
    "𝔶",
    "𝔂",
    "𝓎",
    "𝓨",
    "𝐘",
    "𝐲",
    "𝕐",
    "𝕪",
    "ʸ",
  ],
  "z": [
    "Ⓩ",
    "ⓩ",
    "z",
    "乙",
    "Ｚ",
    "ｚ",
    "Ƶ",
    "Ž",
    "z",
    "z",
    "ž",
    "Ż",
    "𝔷",
    "𝔃",
    "𝓏",
    "𝓩",
    "𝐙",
    "𝐳",
    "ℤ",
    "𝕫",
    "ᶻ",
  ],
};

export const cmdCrazyText: CommandMiddleware<BotContext> = async (ctx) => {
  const text = ctx.match;

  if (!text) {
    await ctx.reply(
      "Missing text. Usage: `/crazytxt text goes here`",
    );
    return;
  }

  const result = text
    .split("")
    .map((char) => {
      const charTable = table[char];
      return Array.isArray(charTable) ? getRandomValue(charTable) : char;
    })
    .join("");

  await Promise.allSettled([
    ctx.deleteMessage(),
    ctx.reply(result),
  ]);
};