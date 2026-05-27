"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Send,
  ShieldCheck,
  Sparkles,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

type BaseQuestion = {
  id: number;
  question: string;
};

type MultipleChoiceQuestion = BaseQuestion & {
  type: "multiple-choice";
  options: string[];
};

type YesNoQuestion = BaseQuestion & {
  type: "yes-no";
};

type RatingQuestion = BaseQuestion & {
  type: "rating";
  min: number;
  max: number;
};

type ShortTextQuestion = BaseQuestion & {
  type: "short-text";
  placeholder?: string;
};

type TextAreaQuestion = BaseQuestion & {
  type: "textarea";
  placeholder?: string;
};

type Question =
  | MultipleChoiceQuestion
  | YesNoQuestion
  | RatingQuestion
  | ShortTextQuestion
  | TextAreaQuestion;

type Answers = Record<number, string | number>;

export default function AssessmentPage() {
  const router = useRouter();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(1);

  const [answers, setAnswers] = useState<Answers>({});
  const [validationError, setValidationError] = useState(false);

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const res = await fetch("/questions.json");

        if (!res.ok) {
          throw new Error("Failed to fetch questions");
        }

        const data = await res.json();

        if (!Array.isArray(data)) {
          throw new Error("Invalid JSON structure");
        }

        setQuestions(data);
      } catch (err) {
        console.error(err);
        setError("Unable to load assessment questions.");
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, []);

  const currentQuestion =
    questions.length > 0 ? questions[currentIndex] : undefined;

  const currentAnswer = currentQuestion
    ? answers[currentQuestion.id]
    : undefined;

  const totalQuestions = questions.length;

  // Progress starts at 0% and updates when we move to next question
  const progress = useMemo(() => {
    if (!totalQuestions) return 0;
    // Show 0% initially, then update after moving to next question
    return Math.round((currentIndex / totalQuestions) * 100);
  }, [currentIndex, totalQuestions]);

  const isLastQuestion = currentIndex === totalQuestions - 1;

  const isAnswered = () => {
    if (!currentQuestion) return false;
    const answer = answers[currentQuestion.id];
    if (answer === undefined || answer === null) return false;
    return String(answer).trim().length > 0;
  };

  const updateAnswer = (value: string | number) => {
    if (!currentQuestion) return;
    setValidationError(false);
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: value,
    }));
  };

  const nextQuestion = () => {
    if (!isAnswered()) {
      setValidationError(true);
      return;
    }
    if (currentIndex < totalQuestions - 1) {
      setDirection(1);
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const previousQuestion = () => {
    setValidationError(false);
    if (currentIndex > 0) {
      setDirection(-1);
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const submitAssessment = async () => {
    if (!isAnswered()) {
      setValidationError(true);
      return;
    }
    setSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 1800));
    router.push("/profile-output");
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F4F7FA] font-sans">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-6"
        >
          <div className="relative">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
              className="h-20 w-20 rounded-full border-4 border-[#5BA4A4]/20 border-t-[#5BA4A4]"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <Sparkles className="h-8 w-8 text-[#5BA4A4]" />
            </div>
          </div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-sm font-semibold uppercase tracking-widest text-[#243B53]/70"
          >
            Loading Assessment
          </motion.p>
        </motion.div>
      </div>
    );
  }

  if (error || !questions.length || !currentQuestion) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F4F7FA] px-6 font-sans">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-lg rounded-3xl bg-white p-12 shadow-xl shadow-[#243B53]/5"
        >
          <div className="mb-8 flex justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-red-50">
              <AlertCircle className="h-10 w-10 text-[#5BA4A4]" />
            </div>
          </div>
          <h2 className="mb-5 text-center text-2xl font-bold text-[#243B53]">
            Assessment Initialization Failed
          </h2>
          <p className="text-center text-sm text-slate-500 leading-relaxed">
            {error || "We couldn't retrieve the assessment questions. Please verify that"}
            <code className="mx-1 rounded-lg bg-[#F4F7FA] px-3 py-1.5 font-mono text-xs text-[#243B53]">
              /public/questions.json
            </code>
            {error ? "" : "exists and contains a valid array structure."}
          </p>
        </motion.div>
      </div>
    );
  }

  if (submitting) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#F4F7FA] px-6 font-sans">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-lg rounded-3xl bg-white p-12 shadow-xl shadow-[#243B53]/5 text-center"
        >
          <motion.div
            animate={{
              scale: [1, 1.1, 1],
              rotate: [0, 10, -10, 0],
            }}
            transition={{
              repeat: Infinity,
              duration: 2.5,
              ease: "easeInOut",
            }}
            className="mb-10 flex justify-center"
          >
            <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-[#5BA4A4]/10">
              <Sparkles className="h-12 w-12 text-[#5BA4A4]" />
            </div>
          </motion.div>

          <h2 className="mb-4 text-2xl font-bold text-[#243B53]">
            Analyzing Your Responses
          </h2>

          <p className="mb-10 text-sm text-slate-500 leading-relaxed">
            TIE is compiling your answers and building your workforce intelligence profile.
          </p>

          <div className="relative h-3 w-full overflow-hidden rounded-full bg-[#F4F7FA]">
            <motion.div
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 1.6, ease: "easeInOut" }}
              className="h-full rounded-full bg-[#5BA4A4]"
            />
          </div>

          <div className="mt-5 flex justify-between text-[10px] font-bold uppercase tracking-widest text-slate-400">
            <span>Processing</span>
            <span>Finalizing</span>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F7FA] font-sans antialiased">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-[#5BA4A4]/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-[#A3B18A]/5 blur-3xl" />
      </div>

      {/* Header */}
      <header className=" header-ass sticky top-0 z-50 border-b border-[#243B53]/5 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-6xl items-center justify-between px-6 sm:px-8">
          <div className="flex items-center gap-6">
            <Image
              src="/logo.png"
              alt="TIE Logo"
              width={140}
              height={62}
              className="object-contain"
              priority
            />
            <div className="hidden items-center gap-3 sm:flex">
              <div className="h-px w-12 bg-[#243B53]/20" />
              <span className="text-xs font-bold uppercase tracking-widest text-[#243B53]/60">
                Assessment
              </span>
            </div>
          </div>

          <div className="flex items-center gap-8">
            <div className="hidden text-right sm:block">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Question Progress
              </p>
              <p className="text-sm font-bold text-[#243B53]">
                {currentIndex + 1} / {totalQuestions}
              </p>
            </div>
            <div className="flex flex-col progress gap-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
               Progress
              </p>
              <div className="flex items-center gap-3">
                <div className="w-40 overflow-hidden rounded-full bg-[#F4F7FA]">
                  <motion.div
                    initial={{ width: "0%" }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className="h-2.5 bg-[#5BA4A4]"
                  />
                </div>
                <span className="text-xs font-bold text-[#5BA4A4] min-w-[3rem] text-right">
                  {progress}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className=" main-ass relative z-10 mx-auto max-w-5xl px-6 py-16 sm:px-8 sm:py-20">
        {/* Title Section */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-14 text-center"
        >

          <h1 className="mb-4 text-4xl font-extrabold text-[#243B53] tracking-tight sm:text-5xl">
            Workforce Insight Assessment
          </h1>

          <p className="mx-auto max-w-lg text-sm text-slate-500 leading-relaxed">
            Help TIE understand your work style and professional strengths through this brief assessment.
          </p>
        </motion.div>

        {/* Question Card */}
        {currentQuestion && (
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentQuestion.id}
              custom={direction}
              initial={{
                opacity: 0,
                x: direction > 0 ? 30 : -30,
                scale: 0.95,
              }}
              animate={{
                opacity: 1,
                x: 0,
                scale: 1,
              }}
              exit={{
                opacity: 0,
                x: direction > 0 ? -30 : 30,
                scale: 0.95,
              }}
              transition={{
                duration: 0.3,
                ease: [0.25, 0.46, 0.45, 0.94],
              }}
              className="qcard-ass rounded-3xl bg-white shadow-xl shadow-[#243B53]/8 overflow-hidden"
            >
              {/* Card Header Accent */}
              <div className="h-1.5 w-full bg-gradient-to-r from-[#5BA4A4] via-[#A3B18A] to-[#5BA4A4]" />

              <div className="p-8 sm:p-12">
                {/* Question Type Badge */}
                <div className="mb-6 inline-flex items-center gap-2.5 rounded-full bg-[#5BA4A4]/8 px-4 py-2">
                  <Sparkles className="h-1 w-1 text-white" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-white">
                    {currentQuestion?.type?.replace("-", " ") || "Question"}
                  </span>
                </div>
                {/* Question Text */}
                <h2 className="mb-9 text-2xl font-bold text-[#243B53] leading-snug sm:text-3xl lg:text-4xl">
                  {currentQuestion.question}
                </h2>

                {/* Answer Options */}
                <div className="space-y-4">
                  {/* Multiple Choice */}
                  {currentQuestion.type === "multiple-choice" &&
                    Array.isArray(currentQuestion.options) &&
                    currentQuestion.options.map((option, idx) => {
                      const isSelected = !!(
                        currentAnswer !== undefined &&
                        currentAnswer !== null &&
                        String(currentAnswer) === option
                      );
                      const optionLetter = String.fromCharCode(65 + idx);

                      return (
                        <motion.button
                          key={option}
                          onClick={() => updateAnswer(option)}
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                          className={`ass group relative flex w-full items-center gap-5 rounded-2xl border-2 p-6 text-left transition-all duration-200 ${
                            isSelected
                              ? "border-[#5BA4A4] bg-[#5BA4A4]/5 shadow-lg shadow-[#5BA4A4]/10"
                              : "border-[#243B53]/10 bg-white hover:border-[#5BA4A4]/40 hover:bg-[#F4F7FA]"
                          }`}
                        >
                          <div
                            className={`ass flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold border-2 transition-all ${
                              isSelected
                                ? "bg-[#5BA4A4] border-[#5BA4A4] text-white"
                                : "bg-white border-[#243B53]/20 text-slate-400 group-hover:border-[#5BA4A4]/50 group-hover:text-[#5BA4A4]"
                            }`}
                          >
                            {isSelected && <CheckCircle2 className="h-5 w-5" />}
                            {!isSelected && optionLetter}
                          </div>
                          <span className="btn-ass text-base font-semibold text-[#243B53] flex-grow">
                            {option}
                          </span>
                          {isSelected && (
                            <CheckCircle2 className="btn-ass h-4 w-4 text-[#5BA4A4]" />
                          )}
                        </motion.button>
                      );
                    })}

                  {/* Yes No */}
                  {currentQuestion.type === "yes-no" && (
                    <div className="grid grid-cols-2 gap-5">
                      {["yes", "no"].map((value) => {
                        const isSelected = !!(
                          currentAnswer !== undefined &&
                          currentAnswer !== null &&
                          String(currentAnswer).toLowerCase() === value.toLowerCase()
                        );

                        return (
                          <motion.button
                            key={value}
                            onClick={() => updateAnswer(value)}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className={`rounded-2xl border-2 py-2 text-base font-bold capitalize transition-all duration-200 ${
                              isSelected
                                ? "border-[#5BA4A4] bg-[#5BA4A4] text-white shadow-lg shadow-[#5BA4A4]/20"
                                : "border-[#243B53]/10 bg-white text-[#243B53] hover:border-[#5BA4A4]/40 hover:bg-[#F4F7FA]"
                            }`}
                          >
                            {value}
                          </motion.button>
                        );
                      })}
                    </div>
                  )}

                  {/* Rating */}
                  {currentQuestion.type === "rating" &&
                    typeof currentQuestion.min === "number" &&
                    typeof currentQuestion.max === "number" && (
                      <div className="flex flex-col items-center gap-6 py-4">
                        <div className="flex flex-wrap justify-center gap-3">
                          {Array.from(
                            {
                              length: Math.max(0, currentQuestion.max - currentQuestion.min + 1),
                            },
                            (_, i) => (currentQuestion.min ?? 0) + i
                          ).map((rating) => {
                            const isSelected = !!(
                              currentAnswer !== undefined &&
                              currentAnswer !== null &&
                              Number(currentAnswer) === rating
                            );

                            return (
                              <motion.button
                                key={rating}
                                onClick={() => updateAnswer(rating)}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.95 }}
                                className={`flex h-14 w-14 items-center justify-center rounded-2xl border-2 text-base font-bold transition-all duration-150 ${
                                  isSelected
                                    ? "border-[#5BA4A4] bg-[#5BA4A4] text-white shadow-lg shadow-[#5BA4A4]/25"
                                    : "border-[#243B53]/10 bg-white text-[#243B53] hover:border-[#5BA4A4]/50 hover:bg-[#F4F7FA]"
                                }`}
                              >
                                {rating}
                              </motion.button>
                            );
                          })}
                        </div>
                        <div className="flex w-full max-w-[28rem] justify-between px-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                          <span>Low</span>
                          <span>High</span>
                        </div>
                      </div>
                    )}

                  {/* Short Text */}
                  {currentQuestion.type === "short-text" && (
                    <div className="relative">
                      <input
                        type="text"
                        value={String(currentAnswer || "")}
                        placeholder={
                          currentQuestion.placeholder ||
                          "Type your answer..."
                        }
                        onChange={(e) => updateAnswer(e.target.value)}
                        className="w-full rounded-2xl border-2 border-[#243B53]/10 bg-[#F4F7FA] px-6 py-4.5 text-base text-[#1F2933] placeholder-slate-400 outline-none transition-all focus:border-[#5BA4A4] focus:bg-white focus:ring-4 focus:ring-[#5BA4A4]/10"
                      />
                    </div>
                  )}

                  {/* Textarea */}
                  {currentQuestion.type === "textarea" && (
                    <div className="relative">
                      <textarea
                        rows={6}
                        value={String(currentAnswer || "")}
                        placeholder={
                          currentQuestion.placeholder ||
                          "Share your response..."
                        }
                        onChange={(e) => updateAnswer(e.target.value)}
                        className="w-full rounded-2xl border-2 border-[#243B53]/10 bg-[#F4F7FA] px-6 py-4.5 text-base text-[#1F2933] placeholder-slate-400 outline-none transition-all focus:border-[#5BA4A4] focus:bg-white focus:ring-4 focus:ring-[#5BA4A4]/10 resize-none"
                      />
                    </div>
                  )}
                </div>

                {/* Validation Error */}
                <AnimatePresence>
                  {validationError && (
                    <motion.div
                      initial={{ opacity: 0, height: 0, y: -10 }}
                      animate={{ opacity: 1, height: "auto", y: 0 }}
                      exit={{ opacity: 0, height: 0, y: -10 }}
                      className=" overflow-hidden"
                    >
                      <div className="mt-6 flex items-start gap-4 rounded-2xl border border-red-200 bg-red-50 px-6 py-5">
                        <AlertCircle className="h-5.5 w-5.5 shrink-0 text-red-500 mt-0.5" />
                        <span className="text-sm font-semibold text-red-600">
                          Please provide an answer before moving to the next question.
                        </span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </AnimatePresence>
        )}

        {/* Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="progress mt-10 flex items-center justify-between gap-6"
        >
          <motion.button
            onClick={previousQuestion}
            disabled={currentIndex === 0}
            whileHover={currentIndex !== 0 ? { scale: 1.02 } : {}}
            whileTap={currentIndex !== 0 ? { scale: 0.98 } : {}}
            className={`ass btn-ass flex items-center gap-2.5 rounded-2xl border-2 px-7 py-3.5 text-xs font-bold transition-all ${
              currentIndex === 0
                ? "cursor-not-allowed border-[#243B53]/10 bg-[#F4F7FA] text-slate-300"
                : "border-[#243B53]/10 bg-white text-[#243B53] hover:border-[#5BA4A4]/40 hover:bg-[#F4F7FA]"
            }`}
          >
            <ChevronLeft className="h-4.5 w-4.5" />
            Previous
          </motion.button>

          {isLastQuestion ? (
            <motion.button
              onClick={submitAssessment}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="ass btn-ass flex items-center gap-2.5 rounded-2xl bg-[#5BA4A4] px-8 py-3.5 text-xs font-bold text-white shadow-lg shadow-[#5BA4A4]/25 transition-all hover:bg-[#4A8D8D] hover:shadow-[#5BA4A4]/35"
            >
              Submit Assessment
              <Send className="h-4.5 w-4.5" />
            </motion.button>
          ) : (
            <motion.button
              onClick={nextQuestion}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="ass btn-ass flex items-center gap-2.5 rounded-2xl bg-[#5BA4A4] px-8 py-3.5 text-xs font-bold text-white shadow-lg shadow-[#5BA4A4]/25 transition-all hover:bg-[#4A8D8D] hover:shadow-[#5BA4A4]/35"
            >
              Next Question
              <ChevronRight className="h-4.5 w-4.5" />
            </motion.button>
          )}
        </motion.div>
      </main>
    </div>
  );
}