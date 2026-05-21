import pdf from "pdf-parse-new";
import mammoth from "mammoth";

const extractText = async (file) => {
  if (!file) {
    throw new Error("Resume file is required");
  }

  if (file.mimetype === "application/pdf") {
    const data = await pdf(file.buffer);
    return data.text;
  }

  if (
    file.mimetype ===
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    const data = await mammoth.extractRawText({ buffer: file.buffer });
    return data.value;
  }

  if (file.mimetype === "text/plain") {
    return file.buffer.toString("utf-8");
  }

  throw new Error("Only PDF, DOCX, and TXT files are supported");
};

const normalizeText = (text) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 2);

const extractKeywords = (text) => {
  const stopwords = new Set([
    "the",
    "and",
    "for",
    "with",
    "that",
    "this",
    "from",
    "your",
    "you",
    "are",
    "will",
    "have",
    "has",
    "but",
    "can",
    "use",
    "using",
    "a",
    "an",
    "or",
    "to",
    "of",
    "in",
    "on",
    "by",
    "as",
    "at",
    "be",
    "is",
    "it",
    "its",
    "about",
    "we",
    "our",
    "role",
    "roles",
    "experience",
  ]);

  const words = normalizeText(text);
  return [...new Set(words.filter((word) => !stopwords.has(word)))].slice(0, 35);
};

const buildWeakSections = (resumeText) => {
  const weakSections = [];
  const normalized = resumeText.toLowerCase();

  if (!/project/.test(normalized)) weakSections.push("Projects");
  if (!/achievement|accomplishment/.test(normalized)) weakSections.push("Achievements");
  if (!/experience|worked|responsible/.test(normalized)) weakSections.push("Experience");
  if (!/skill|technology|tech stack|tools/.test(normalized)) weakSections.push("Skills");

  return weakSections.slice(0, 3);
};

export const checkATS = async (req, res) => {
  try {
    const { jobDescription } = req.body;

    if (!jobDescription) {
      return res.status(400).json({
        success: false,
        message: "Job description is required",
      });
    }

    const resumeText = await extractText(req.file);
    const resumeTextLower = resumeText.toLowerCase();
    const keywords = extractKeywords(jobDescription);

    const matchedKeywords = keywords.filter((keyword) =>
      resumeTextLower.includes(keyword)
    );

    const missingKeywords = keywords.filter(
      (keyword) => !resumeTextLower.includes(keyword)
    );

    const keywordMatchRate = keywords.length
      ? matchedKeywords.length / keywords.length
      : 0;

    const lengthBonus = Math.min(normalizeText(resumeText).length / 250, 1);
    let atsScore = Math.round(30 + keywordMatchRate * 55 + lengthBonus * 15);
    atsScore = Math.max(25, Math.min(atsScore, 100));

    const weakSections = buildWeakSections(resumeText);
    const suggestions = [];

    if (missingKeywords.length > 0) {
      suggestions.push(
        `Add more job-specific keywords: ${missingKeywords
          .slice(0, 5)
          .join(", ")}`
      );
    }

    if (!/achievement|accomplishment/.test(resumeTextLower)) {
      suggestions.push("Include measurable achievements and results.");
    }

    if (!/project/.test(resumeTextLower)) {
      suggestions.push("Add a clear Projects section with details.");
    }

    if (normalizeText(resumeText).length < 200) {
      suggestions.push(
        "Expand your resume with more specific responsibilities and outcomes."
      );
    }

    if (suggestions.length === 0) {
      suggestions.push("Your resume is well-aligned with the job description.");
    }

    const summary = `Matched ${matchedKeywords.length} of ${keywords.length} important keywords from the job description.`;

    return res.status(200).json({
      success: true,
      result: {
        atsScore,
        summary,
        matchingSkills: matchedKeywords.slice(0, 6),
        missingKeywords: missingKeywords.slice(0, 6),
        weakSections,
        suggestions,
        improvedSummary:
          "Update your resume to include the missing keywords, quantify achievements, and make your skills more explicit.",
      },
    });
  } catch (error) {
    console.log("ATS ERROR:", error.message);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};