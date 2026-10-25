import pdf from "pdf-parse-new";
import mammoth from "mammoth";

const extractText = async (file) => {
  if (!file) {
    throw new Error("Resume file is required");
  }

  if (file.mimetype === "application/pdf") {
    // PDF.js can emit noisy font-hinting and standard-font diagnostics for
    // otherwise readable resumes. Keep parser logs to errors only.
    const data = await pdf(file.buffer, { verbosityLevel: 0 });
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
    if (!resumeText.trim()) {
      return res.status(422).json({
        success: false,
        message: "Could not extract readable text from this resume. If it is a scanned PDF, run OCR or upload a DOCX with selectable text.",
      });
    }

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
    const issues = [];

    if (missingKeywords.length > 0) {
      const keywordsToAdd = missingKeywords.slice(0, 8);
      suggestions.push(
        `Add relevant job keywords where they accurately reflect your experience: ${keywordsToAdd.join(", ")}.`
      );
      issues.push({
        title: "Important job description keywords are missing",
        details: `These terms were not found in your resume: ${keywordsToAdd.join(", ")}.`,
        fix: "Add the relevant terms to your Skills or Experience sections, and include them in context. Only include skills you actually have; avoid keyword stuffing.",
      });
    }

    if (!/achievement|accomplishment/.test(resumeTextLower)) {
      suggestions.push("Add achievements that show the results of your work.");
      issues.push({
        title: "Achievements or results are not clearly highlighted",
        details: "The resume does not appear to have an Achievements section or use achievement language.",
        fix: "Add 2–4 accomplishment bullets under your relevant roles. Start with an action verb and explain the result, for example: “Automated weekly reports, saving the team 5 hours per week.”",
      });
    }

    if (!/project/.test(resumeTextLower)) {
      suggestions.push("Add a Projects section if you have relevant work to show.");
      issues.push({
        title: "A Projects section was not found",
        details: "Relevant projects can help demonstrate skills that are not clear from work history alone.",
        fix: "Add a Projects section with the project goal, your contribution, tools used, and outcome. Skip this if projects are not relevant to your background.",
      });
    }

    if (weakSections.length > 0) {
      issues.push({
        title: "Common resume sections may be missing",
        details: `Could not find these sections or related terms: ${weakSections.join(", ")}.`,
        fix: "If relevant, add clearly labeled sections such as Skills, Experience, Projects, and Achievements. Use simple, standard headings so applicant tracking systems can identify them.",
      });
    }

    if (!/(\d+\s?%|\$\s?\d+|\b\d+\s?(users|customers|clients|people|hours|days|weeks|months|years)\b)/i.test(resumeText)) {
      issues.push({
        title: "No measurable results were detected",
        details: "The resume may describe responsibilities without showing their scale or impact.",
        fix: "Where you can support it, add numbers such as time saved, revenue gained, users served, or error reduction. Do not guess or invent metrics.",
      });
    }

    if (normalizeText(resumeText).length < 200) {
      suggestions.push(
        "Add more detail about relevant responsibilities and outcomes."
      );
      issues.push({
        title: "Resume content looks very short",
        details: "The extracted resume text is brief, which may leave relevant experience or skills unclear.",
        fix: "Add concise bullets describing relevant responsibilities, tools, and outcomes. Keep the content accurate and focused on the target role.",
      });
    }

    if (suggestions.length === 0) {
      suggestions.push("Your resume is well-aligned with the job description.");
    }

    if (issues.length === 0) {
      issues.push({
        title: "No major issues detected by these checks",
        details: "The automated checks found job keywords and common resume sections.",
        fix: "Review the resume yourself for accuracy, clear formatting, and examples tailored to the role.",
      });
    }

    const summary = `Matched ${matchedKeywords.length} of ${keywords.length} important keywords from the job description.`;

    return res.status(200).json({
      success: true,
      result: {
        atsScore,
        summary,
        issues,
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
