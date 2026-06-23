# Talent Intelligence Engine (TIE)

TIE is a next-generation **workforce intelligence platform** that maps how individuals and teams naturally work, communicate, collaborate, adapt, and grow. Shifting the focus from legacy "personality tests" or intrusive surveillance, TIE surfaces evidence-based operational preferences to help managers, HR, and executives support employees and design cohesive, high-performing workplaces.

---

## 🛠️ Technology Stack

TIE is architected as a decoupled modern web application:

- **Frontend**: Next.js 16 (App Router, Turbopack, Tailwind CSS, Framer Motion)
- **Backend API**: FastAPI (Python 3.11, Uvicorn, Pydantic, Google GenAI SDK)
- **Database & Auth**: Supabase (PostgreSQL with Row Level Security policies)

---

## 📁 Key Directory Structure

```
TIE/
├── backend/                     # FastAPI python service
│   ├── main.py                  # API endpoints, scoring engine, & AI processing
│   ├── profile_content_library.py # Predefined workplace combinations insights
│   └── requirements.txt         # Backend python dependencies
├── src/                         # Next.js frontend code
│   ├── app/                     # Next.js App Router folders
│   │   ├── (auth)/              # Sign in, Sign up, Forgot password paths
│   │   ├── assessment/          # Active 24-question preference assessment page
│   │   ├── profile-output/      # Insight dashboard and PDF report page
│   │   ├── reflection/          # Post-assessment self-reflection feedback form
│   │   └── welcome/             # Assessment start screen
│   ├── components/              # Shared UI components
│   ├── context/                 # AuthContext handling auth state & profiles
│   ├── lib/                     # Client libraries (Supabase, seededShuffle)
│   ├── services/                # Database services (assessmentService, projectService)
│   └── styles/                  # Styling system and visual themes
├── public/                      # Static assets (logos, icons)
├── package.json                 # Node package configuration
└── .env.local                   # Environment variables (Supabase and Gemini keys)
```

---

## 💾 Database Schema (Supabase)

TIE relies on four primary database tables within the `public` schema of Supabase:

### 1. `profiles`
Stores employee profile details and the seed used for option randomization.
- `id` (uuid, primary key): References Supabase Auth UID.
- `first_name` (text), `last_name` (text), `email` (text)
- `employee_id` (text), `designation` (text), `experiense_years` (integer)
- `interests` (text[]): List of professional areas of interest.
- `role` (text): Default role is `user`.
- `assessment_seed` (integer): A random, persistent user seed used to lock shuffled option layouts.

### 2. `assessment_questions`
Holds the static structure of the assessment.
- `question_id` (integer, primary key)
- `question_text` (text): Description of the assessment scenario.
- `options` (text[]): Four multiple-choice options corresponding to the four behavioral patterns:
  - Index `0` $\rightarrow$ **Structured Clarity (SCP)**
  - Index `1` $\rightarrow$ **Focused Independence (FIE)**
  - Index `2` $\rightarrow$ **Cooperative Collaboration (CCD)**
  - Index `3` $\rightarrow$ **Stable Pace Orientation (SPO)**

### 3. `user_responses`
Tracks active answers submitted by the user.
- `user_id` (uuid, primary key, foreign key)
- `question_id` (integer, primary key, foreign key)
- `selected_option_index` (integer): Index of the chosen option relative to the **original order** (0-3).
- `submitted_at` (timestamp)

### 4. `assessment_feedback`
Stores employee self-reflection feedback upon completion of the assessment.
- `id` (uuid, primary key)
- `user_id` (uuid, foreign key): References `profiles.id`.
- `work_style_accuracy` (integer): User rating (1-5) of assessment accuracy.
- `important_dimension` (text): The dimension of performance most important to the user (e.g. `'Collaboration'`, `'Adaptability'`, `'Growth Style'`).
- `takeaways_reflection` (text): Key reflections and open comments.
- `created_at` (timestamp)

---

## 🔀 Shuffling & Scoring Engine

To guarantee assessment integrity, TIE shuffles multiple-choice options differently for each user:

1. **Deterministic Randomness**: A user-specific seed `assessment_seed` is loaded. The seed for question $Q$ is computed as `assessment_seed + question_id`.
2. **Options Shuffling**: The frontend uses a MurmurHash3-scrambled LCG generator to shuffle the list of options visually in a unique layout for each question.
3. **Persisted Index**: When an option is clicked, the application maps it back to its **original index (0-3)** in `assessment_questions.options` before saving to `user_responses`.
4. **Backend Analysis**: The FastAPI backend parses the responses using the original indexes:
   ```python
   index_to_pattern = {0: "SCP", 1: "FIE", 2: "CCD", 3: "SPO"}
   ```
   This ensures that scoring remains completely intact and independent of visual shuffling.

---

## 🤖 AI Report Generation Flow (Gemini Prompt V2)

The detailed workforce report is compiled using a structured, reference-based pipeline:

```
[Assessment Submissions] 
      │
      ▼
[Scoring Engine calculates raw scores & primary/secondary patterns]
      │
      ▼
[Identify Combination Profile Archetype]
      │
      ▼
[Fetch Matching Reference insights from Profile Content Library]
      │
      ▼
[Inject reference context & scores into Gemini Prompt V2]
      │
      ▼
[Gemini generates structured 14-section markdown report]
      │
      ▼
[Frontend renders report and exports clean, high-resolution PDF]
```

### Generated Report Structure
The resulting narrative contains exactly 14 structured sections:
1. **Dominant Workplace Pattern**
2. **What TIE Observed**
3. **Workplace Value**
4. **Workplace Implications**
5. **Thrive Conditions**
6. **Challenge Conditions**
7. **Watch-outs**
8. **How Others May Experience You**
9. **What Your Manager Should Know**
10. **Manager Support Suggestions**
11. **Growth Suggestions**
12. **Why TIE Reached This Conclusion**
13. **What TIE Measures**
14. **What TIE Does Not Measure**

---

## 🚀 Local Development Setup

To run TIE on localhost, open two separate terminal windows:

### Terminal 1: Backend API (FastAPI)
```bash
# Navigate to project root
cd "C:\Users\kjsan\OneDrive\Documents\TIE Project\TIE"

# Start the uvicorn server using the local virtual environment
.venv\Scripts\uvicorn main:app --reload --host 127.0.0.1 --port 8000 --app-dir backend
```
*Backend server runs at `http://127.0.0.1:8000`.*

### Terminal 2: Frontend App (Next.js)
```bash
# Navigate to project root
cd "C:\Users\kjsan\OneDrive\Documents\TIE Project\TIE"

# Start the Next.js development server
npm run dev
```
*Frontend application runs at `http://localhost:3000`.*
