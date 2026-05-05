import OpenAI from "openai";

export default async function handler(req, res) {

  // 🔥 CORS対応（これが超重要）
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(200).json({ answer: "POSTのみ対応しています。" });
  }

  try {
    // 🔥 messageでもquestionでも受け取れる
    const { plan, category, question, message } = req.body || {};
    const finalQuestion = question || message;

    if (!plan || !category || !finalQuestion) {
      return res.status(400).json({ answer: "入力が不足しています。" });
    }

    if (finalQuestion.length > 160) {
      return res.status(400).json({ answer: "質問は160文字以内にしてください。" });
    }

    const baseCategories = ["english", "study", "focus"];
    const upgradeCategories = ["long_reading", "medical_english"];

    const allowedCategories =
      plan === "upgrade"
        ? baseCategories.concat(upgradeCategories)
        : baseCategories;

    if (!allowedCategories.includes(category)) {
      return res.status(400).json({
        answer: "このカテゴリは現在のプランでは使えません。"
      });
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    const isUpgrade = plan === "upgrade";

    const instructions = isUpgrade
      ? "あなたは医学部受験・英検準1級から1級にも対応する、優しい学習AIです。勉強に関する質問だけ答えてください。答えを丸投げせず、考え方・ヒント・次にやることを具体的に示してください。日本語で250文字以内。"
      : "あなたは自習室の優しい学習AIです。英語・勉強方法・集中に関する質問だけ答えてください。勉強以外の質問には『勉強に関する質問だけ答えます。』と返してください。日本語で150文字以内。";

    const response = await openai.responses.create({
      model: isUpgrade ? "gpt-4.1" : "gpt-4.1-mini",
      instructions,
      input: `プラン:${plan}\nカテゴリ:${category}\n質問:${finalQuestion}`
    });

    return res.status(200).json({
      answer: response.output_text || "回答できませんでした。"
    });

  } catch (error) {
    return res.status(500).json({
      answer: "AIの応答に失敗しました。APIキーや設定を確認してください。"
    });
  }
}
