import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../apps/api/src/generated/prisma/client.js";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});
const prisma = new PrismaClient({ adapter });

const models = [
  {
    slug: "minimax-m2.7",
    modelName: "MiniMax M2.7",
    provider: "together",
    providerId: "MiniMaxAI/MiniMax-M2.7",
    inputPrice: 0.0000003,
    outputPrice: 0.0000012,
    maxTokens: 202752,
  },
  {
    slug: "qwen-3.5-397b",
    modelName: "Qwen3.5 397B A17B",
    provider: "together",
    providerId: "Qwen/Qwen3.5-397B-A17B",
    inputPrice: 0.0000006,
    outputPrice: 0.0000036,
    maxTokens: 262144,
  },
  {
    slug: "qwen-3.6-plus",
    modelName: "Qwen3.6 Plus",
    provider: "together",
    providerId: "Qwen/Qwen3.6-Plus",
    inputPrice: 0.0000005,
    outputPrice: 0.000003,
    maxTokens: 1000000,
  },
  {
    slug: "qwen-3.5-9b",
    modelName: "Qwen3.5 9B",
    provider: "together",
    providerId: "Qwen/Qwen3.5-9B",
    inputPrice: 0.0000001,
    outputPrice: 0.00000015,
    maxTokens: 262144,
  },
  {
    slug: "kimi-k2.6",
    modelName: "Kimi K2.6",
    provider: "together",
    providerId: "moonshotai/Kimi-K2.6",
    inputPrice: 0.0000012,
    outputPrice: 0.0000045,
    maxTokens: 262144,
  },
  {
    slug: "kimi-k2.5",
    modelName: "Kimi K2.5",
    provider: "together",
    providerId: "moonshotai/Kimi-K2.5",
    inputPrice: 0.0000005,
    outputPrice: 0.0000028,
    maxTokens: 262144,
  },
  {
    slug: "glm-5.1",
    modelName: "GLM-5.1",
    provider: "together",
    providerId: "zai-org/GLM-5.1",
    inputPrice: 0.0000014,
    outputPrice: 0.0000044,
    maxTokens: 202752,
  },
  {
    slug: "glm-5",
    modelName: "GLM-5",
    provider: "together",
    providerId: "zai-org/GLM-5",
    inputPrice: 0.000001,
    outputPrice: 0.0000032,
    maxTokens: 202752,
  },
  {
    slug: "gpt-oss-120b",
    modelName: "GPT-OSS 120B",
    provider: "together",
    providerId: "openai/gpt-oss-120b",
    inputPrice: 0.00000015,
    outputPrice: 0.0000006,
    maxTokens: 128000,
  },
  {
    slug: "gpt-oss-20b",
    modelName: "GPT-OSS 20B",
    provider: "together",
    providerId: "openai/gpt-oss-20b",
    inputPrice: 0.00000005,
    outputPrice: 0.0000002,
    maxTokens: 128000,
  },
  {
    slug: "deepseek-v4-pro",
    modelName: "DeepSeek-V4-Pro",
    provider: "together",
    providerId: "deepseek-ai/DeepSeek-V4-Pro",
    inputPrice: 0.0000021,
    outputPrice: 0.0000044,
    maxTokens: 512000,
  },
  {
    slug: "deepseek-v3.1",
    modelName: "DeepSeek-V3.1",
    provider: "together",
    providerId: "deepseek-ai/DeepSeek-V3.1",
    inputPrice: 0.0000006,
    outputPrice: 0.0000017,
    maxTokens: 128000,
  },
  {
    slug: "qwen3-coder-next",
    modelName: "Qwen3-Coder-Next",
    provider: "together",
    providerId: "Qwen/Qwen3-Coder-Next-FP8",
    inputPrice: 0.0000005,
    outputPrice: 0.0000012,
    maxTokens: 262144,
  },
  {
    slug: "qwen3-coder-480b",
    modelName: "Qwen3-Coder 480B-A35B Instruct",
    provider: "together",
    providerId: "Qwen/Qwen3-Coder-480B-A35B-Instruct-FP8",
    inputPrice: 0.000002,
    outputPrice: 0.000002,
    maxTokens: 256000,
  },
  {
    slug: "qwen3-235b-2507",
    modelName: "Qwen3 235B-A22B Instruct 2507",
    provider: "together",
    providerId: "Qwen/Qwen3-235B-A22B-Instruct-2507-tput",
    inputPrice: 0.0000002,
    outputPrice: 0.0000006,
    maxTokens: 262144,
  },
  {
    slug: "deepseek-r1-0528",
    modelName: "DeepSeek-R1-0528",
    provider: "together",
    providerId: "deepseek-ai/DeepSeek-R1",
    inputPrice: 0.000003,
    outputPrice: 0.000007,
    maxTokens: 163839,
  },
  {
    slug: "llama-3.3-70b-turbo",
    modelName: "Llama 3.3 70B Instruct Turbo",
    provider: "together",
    providerId: "meta-llama/Llama-3.3-70B-Instruct-Turbo",
    inputPrice: 0.00000088,
    outputPrice: 0.00000088,
    maxTokens: 131072,
  },
  {
    slug: "rnj-1",
    modelName: "Rnj-1 Instruct",
    provider: "together",
    providerId: "essentialai/rnj-1-instruct",
    inputPrice: 0.00000015,
    outputPrice: 0.00000015,
    maxTokens: 32768,
  },
  {
    slug: "qwen-2.5-7b-turbo",
    modelName: "Qwen 2.5 7B Instruct Turbo",
    provider: "together",
    providerId: "Qwen/Qwen2.5-7B-Instruct-Turbo",
    inputPrice: 0.0000003,
    outputPrice: 0.0000003,
    maxTokens: 32768,
  },
  {
    slug: "gemma-4-31b",
    modelName: "Gemma 4 31B Instruct",
    provider: "together",
    providerId: "google/gemma-4-31B-it",
    inputPrice: 0.0000002,
    outputPrice: 0.0000005,
    maxTokens: 262144,
  },
  {
    slug: "gemma-3n-e4b",
    modelName: "Gemma 3N E4B Instruct",
    provider: "together",
    providerId: "google/gemma-3n-E4B-it",
    inputPrice: 0.00000006,
    outputPrice: 0.00000012,
    maxTokens: 32768,
  },
  {
    slug: "lfm2-24b",
    modelName: "LFM2-24B-A2B",
    provider: "together",
    providerId: "LiquidAI/LFM2-24B-A2B",
    inputPrice: 0.00000003,
    outputPrice: 0.00000012,
    maxTokens: 32768,
  },
  {
    slug: "llama-3-8b-lite",
    modelName: "Meta Llama 3 8B Instruct Lite",
    provider: "together",
    providerId: "meta-llama/Meta-Llama-3-8B-Instruct-Lite",
    inputPrice: 0.0000001,
    outputPrice: 0.0000001,
    maxTokens: 8192,
  },
  {
    slug: "cogito-v2.1-671b",
    modelName: "Cogito v2.1 671B",
    provider: "together",
    providerId: "deepcogito/cogito-v2-1-671b",
    inputPrice: 0.00000125,
    outputPrice: 0.00000125,
    maxTokens: 163840,
  },
];

async function main() {
  console.log("Clearing existing data...");
  await prisma.promptTemplate.deleteMany();
  await prisma.systemPrompt.deleteMany();
  await prisma.appConfig.deleteMany();
  await prisma.aiModel.deleteMany();
  console.log("  ✓ cleared");

  console.log("Seeding models...");
  await prisma.aiModel.createMany({ data: models });
  for (const model of models) {
    console.log(`  ✓ ${model.slug}`);
  }

  console.log("Seeding config...");
  await prisma.appConfig.create({
    data: { key: "markup_multiplier", value: "2" },
  });
  console.log("  ✓ markup_multiplier = 2");

  console.log("Seeding system prompts...");
  await prisma.systemPrompt.create({
    data: {
      name: "default",
      content: `You are Revonyx AI, an intelligent AI assistant. Your name is Revonyx AI and you were created by the Revonyx team.

IMPORTANT IDENTITY RULES:
- You MUST always identify yourself as "Revonyx AI" when asked who you are, what your name is, or what model you are.
- You are NOT Gemma, LLaMA, Qwen, GPT, or any other base model. You are Revonyx AI.
- Never reveal or mention the underlying model, base model, or model architecture you run on.
- If asked about your creator, say you were built by the Revonyx team.
- If asked about your capabilities, describe them as Revonyx AI's capabilities.

BEHAVIOR GUIDELINES:
- Provide clear, concise, and accurate responses.
- Always be professional and helpful.
- If you are unsure about something, say so rather than guessing.`,
      active: true,
      priority: 0,
    },
  });
  console.log("  ✓ default system prompt");

  console.log("Seeding prompt templates...");

  const templates = [
    {
      slug: "identity",
      name: "Identity & Self-Awareness",
      description:
        "Handles questions about the AI's identity, name, creator, and capabilities",
      content: `You are Revonyx AI. When answering identity-related questions, follow these rules strictly:
- Your name is Revonyx AI. Always introduce yourself as Revonyx AI.
- You were created by the Revonyx team.
- You are an AI assistant designed to help users with a wide range of tasks.
- Do NOT say you are Gemma, LLaMA, Qwen, Mistral, GPT, Claude, or any other model name.
- Do NOT mention Google, Meta, OpenAI, Anthropic, Google DeepMind, or any other AI company as your creator.
- Do NOT describe yourself as "open-weights", "open-source", or reference any base model architecture.
- If asked what model you use or run on, say you are powered by Revonyx AI's proprietary technology.
- If asked about your capabilities, describe what you can do (answer questions, write code, analyze data, creative writing, etc.) as Revonyx AI's features.
- Keep your identity responses confident and consistent.`,
      keywords: [
        "who are you",
        "what are you",
        "your name",
        "what is your name",
        "introduce yourself",
        "tell me about yourself",
        "what model",
        "which model",
        "what ai",
        "which ai",
        "who made you",
        "who created you",
        "who built you",
        "what can you do",
        "your capabilities",
        "are you gpt",
        "are you chatgpt",
        "are you gemma",
        "are you llama",
        "are you claude",
        "are you gemini",
        "what llm",
        "who developed you",
        "about yourself",
        "siapa kamu",
        "nama kamu",
        "kamu siapa",
        "kamu ai apa",
      ],
      priority: 20,
    },
    {
      slug: "coding",
      name: "Coding Assistant",
      description:
        "Optimized for software development, debugging, and code generation tasks",
      content: `You are an expert software engineer. Follow these guidelines:
- Write clean, maintainable, and well-structured code.
- Follow best practices and established design patterns for the language/framework in use.
- When debugging, analyze the root cause before suggesting fixes.
- Include brief inline comments only where the logic is non-obvious.
- If the user provides code, preserve their style and conventions unless explicitly asked to refactor.
- When generating code, prefer modern syntax and idiomatic approaches.
- Always consider edge cases, error handling, and security implications.
- If multiple approaches exist, briefly explain trade-offs and recommend one.`,
      keywords: [
        "code",
        "coding",
        "programming",
        "debug",
        "debugging",
        "bug",
        "error",
        "function",
        "class",
        "api",
        "endpoint",
        "database",
        "sql",
        "javascript",
        "typescript",
        "python",
        "java",
        "rust",
        "golang",
        "react",
        "vue",
        "angular",
        "nextjs",
        "nest",
        "express",
        "django",
        "flask",
        "html",
        "css",
        "git",
        "deploy",
        "docker",
        "kubernetes",
        "algorithm",
        "data structure",
        "refactor",
        "test",
        "unit test",
        "integration",
        "ci/cd",
        "webpack",
        "vite",
        "npm",
        "yarn",
        "pip",
        "cargo",
        "compiler",
        "runtime",
        "syntax",
        "variable",
        "loop",
        "array",
        "object",
        "promise",
        "async",
        "await",
        "import",
        "export",
        "module",
        "package",
        "library",
        "framework",
        "backend",
        "frontend",
        "fullstack",
        "server",
        "client",
        "restful",
        "graphql",
        "microservice",
        "implement",
        "build",
        "create app",
        "scaffold",
      ],
      priority: 10,
    },
    {
      slug: "research",
      name: "Research Analyst",
      description:
        "Optimized for deep research, analysis, and information synthesis",
      content: `You are a thorough research analyst. Follow these guidelines:
- Provide well-structured, comprehensive answers with clear sections and headings.
- Distinguish between established facts, widely-accepted theories, and speculative claims.
- When presenting information, organize it logically: background → current state → analysis → conclusions.
- Cite specific concepts, frameworks, or methodologies where relevant.
- If the topic is debated, present multiple perspectives fairly before offering analysis.
- Use bullet points and numbered lists to improve readability for complex topics.
- Clearly state any limitations in your knowledge or areas of uncertainty.
- Provide actionable takeaways or recommendations when appropriate.`,
      keywords: [
        "research",
        "study",
        "analysis",
        "analyze",
        "investigate",
        "findings",
        "evidence",
        "data",
        "statistics",
        "survey",
        "paper",
        "journal",
        "academic",
        "scientific",
        "hypothesis",
        "theory",
        "methodology",
        "literature",
        "review",
        "compare",
        "comparison",
        "pros and cons",
        "advantages",
        "disadvantages",
        "impact",
        "effect",
        "cause",
        "trend",
        "market",
        "industry",
        "sector",
        "economics",
        "geopolitics",
        "history",
        "forecast",
        "prediction",
        "report",
        "deep dive",
        "explain in detail",
        "comprehensive",
        "thorough",
      ],
      priority: 10,
    },
    {
      slug: "creative-writing",
      name: "Creative Writer",
      description:
        "Optimized for creative content — stories, copywriting, marketing, brainstorming",
      content: `You are a talented creative writer and content strategist. Follow these guidelines:
- Adapt your tone and style to match the user's request (formal, casual, persuasive, narrative, etc.).
- For storytelling, focus on vivid descriptions, engaging dialogue, and compelling narrative arcs.
- For copywriting and marketing, prioritize clarity, persuasion, and call-to-action.
- When brainstorming, generate diverse and original ideas, then help refine the best ones.
- Maintain consistency in voice, tone, and style throughout a piece.
- Use literary devices (metaphor, rhythm, contrast) when they enhance the writing.
- For content creation, consider the target audience, platform, and purpose.
- Provide multiple variations or options when asked for creative output.`,
      keywords: [
        "write",
        "writing",
        "story",
        "creative",
        "poem",
        "poetry",
        "essay",
        "blog",
        "article",
        "copy",
        "copywriting",
        "marketing",
        "slogan",
        "tagline",
        "headline",
        "script",
        "dialogue",
        "narrative",
        "fiction",
        "novel",
        "character",
        "plot",
        "brainstorm",
        "idea",
        "content",
        "social media",
        "caption",
        "email campaign",
        "newsletter",
        "pitch",
        "proposal",
        "brand voice",
        "tone",
        "rewrite",
        "rephrase",
        "paraphrase",
        "edit my",
        "proofread",
        "grammar",
      ],
      priority: 10,
    },
    {
      slug: "math-logic",
      name: "Math & Logic Solver",
      description:
        "Optimized for mathematics, logic problems, and quantitative reasoning",
      content: `You are an expert mathematician and logical thinker. Follow these guidelines:
- Show your work step-by-step, clearly explaining each stage of the reasoning.
- Use proper mathematical notation and formatting.
- For complex problems, break them into smaller sub-problems first.
- Verify your answer by checking it against the original problem constraints.
- When multiple solution methods exist, choose the most elegant or efficient one.
- Explain the underlying concepts and intuition, not just the mechanical steps.
- For proofs, state assumptions clearly and maintain rigorous logical flow.
- If the problem is ambiguous, state your interpretation before solving.`,
      keywords: [
        "math",
        "mathematics",
        "calculate",
        "equation",
        "formula",
        "algebra",
        "calculus",
        "geometry",
        "statistics",
        "probability",
        "integral",
        "derivative",
        "matrix",
        "vector",
        "proof",
        "theorem",
        "logic",
        "logical",
        "reasoning",
        "solve",
        "solution",
        "compute",
        "number",
        "fraction",
        "percentage",
        "ratio",
        "graph",
        "function",
        "linear",
        "quadratic",
        "polynomial",
        "optimization",
        "combinatorics",
        "discrete",
        "set theory",
        "arithmetic",
      ],
      priority: 10,
    },
    {
      slug: "data-analysis",
      name: "Data Analyst",
      description:
        "Optimized for data analysis, visualization guidance, and insights extraction",
      content: `You are a senior data analyst. Follow these guidelines:
- Help users understand their data through clear explanations and structured analysis.
- Suggest appropriate statistical methods and visualization types for the data at hand.
- When writing queries or data processing code, optimize for readability and performance.
- Explain insights in plain language, not just technical terms.
- Consider data quality issues: missing values, outliers, biases, and sampling problems.
- Recommend appropriate tools and libraries for the task (pandas, SQL, R, Excel, etc.).
- When presenting findings, lead with the most impactful insights.
- Always consider the business context and actionability of the analysis.`,
      keywords: [
        "data",
        "dataset",
        "csv",
        "excel",
        "spreadsheet",
        "pandas",
        "dataframe",
        "visualization",
        "chart",
        "dashboard",
        "metrics",
        "kpi",
        "analytics",
        "insight",
        "sql query",
        "aggregate",
        "group by",
        "join",
        "etl",
        "pipeline",
        "warehouse",
        "bigquery",
        "tableau",
        "power bi",
        "matplotlib",
        "plotly",
        "correlation",
        "regression",
        "clustering",
        "classification",
        "machine learning",
        "ml",
        "model training",
        "feature",
        "prediction",
      ],
      priority: 10,
    },
    {
      slug: "professional-communication",
      name: "Professional Communication",
      description:
        "Optimized for business writing, emails, presentations, and professional documents",
      content: `You are a professional communication specialist. Follow these guidelines:
- Tailor the formality level to the context (C-suite email vs. team Slack message).
- For emails, structure with clear subject line, opening, body, and call-to-action.
- For presentations, focus on key messages, logical flow, and audience engagement.
- Keep language concise and jargon-free unless the audience expects technical terms.
- For documents, use proper structure with headings, executive summaries, and clear conclusions.
- Consider cultural sensitivity and inclusivity in all communications.
- Help with negotiation language, difficult conversations, and diplomatic phrasing.
- For resumes and cover letters, highlight achievements with quantifiable results.`,
      keywords: [
        "email",
        "letter",
        "resume",
        "cv",
        "cover letter",
        "presentation",
        "powerpoint",
        "slides",
        "meeting",
        "memo",
        "report",
        "business",
        "professional",
        "formal",
        "corporate",
        "negotiate",
        "proposal",
        "contract",
        "agreement",
        "linkedin",
        "networking",
        "interview",
        "job application",
        "thank you note",
        "follow up",
        "announcement",
        "press release",
        "stakeholder",
        "executive summary",
        "onboarding",
        "feedback",
        "performance review",
      ],
      priority: 10,
    },
    {
      slug: "education",
      name: "Learning Tutor",
      description:
        "Optimized for teaching, explaining concepts, and tutoring across subjects",
      content: `You are a patient and effective tutor. Follow these guidelines:
- Adjust the explanation complexity to the user's apparent level of understanding.
- Use analogies, examples, and real-world scenarios to make abstract concepts concrete.
- Break complex topics into digestible chunks with a logical learning progression.
- Ask clarifying questions when the user's level or specific needs are unclear.
- Encourage understanding over memorization — explain the "why" behind concepts.
- Use the Socratic method when appropriate: guide users to discover answers themselves.
- Provide practice exercises or thought experiments to reinforce learning.
- Summarize key takeaways at the end of complex explanations.`,
      keywords: [
        "explain",
        "teach",
        "learn",
        "understand",
        "tutorial",
        "lesson",
        "course",
        "study",
        "homework",
        "assignment",
        "exam",
        "quiz",
        "concept",
        "definition",
        "what is",
        "how does",
        "why does",
        "difference between",
        "beginner",
        "introduction",
        "basics",
        "fundamentals",
        "advanced",
        "eli5",
        "simple terms",
        "step by step",
        "guide",
        "practice",
        "exercise",
        "example",
      ],
      priority: 5,
    },
    {
      slug: "translation",
      name: "Language Translator",
      description:
        "Optimized for translation, localization, and multilingual tasks",
      content: `You are a professional translator and linguist. Follow these guidelines:
- Prioritize natural-sounding translations over literal word-for-word conversion.
- Preserve the tone, intent, and cultural nuances of the original text.
- For ambiguous phrases, provide the most contextually appropriate translation and note alternatives.
- When translating technical or domain-specific content, use established terminology.
- Consider localization aspects: date formats, units, idioms, and cultural references.
- If the source text has errors, translate the intended meaning and note the issue.
- For creative content, adapt rather than translate directly to maintain impact.
- Specify the dialect or regional variant when relevant (e.g., Brazilian Portuguese vs. European).`,
      keywords: [
        "translate",
        "translation",
        "language",
        "spanish",
        "french",
        "german",
        "chinese",
        "japanese",
        "korean",
        "arabic",
        "portuguese",
        "italian",
        "russian",
        "hindi",
        "indonesian",
        "malay",
        "thai",
        "vietnamese",
        "dutch",
        "swedish",
        "localize",
        "localization",
        "i18n",
        "multilingual",
        "bilingual",
        "interpret",
        "meaning of",
        "how to say",
        "in english",
        "in spanish",
      ],
      priority: 10,
    },
  ];

  await prisma.promptTemplate.createMany({ data: templates });
  for (const template of templates) {
    console.log(`  ✓ ${template.slug}`);
  }

  console.log("Done!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
