# WBIL Master Behavior Library Dataset (WB-001 through WB-032)

WBIL_MASTER_BEHAVIOURS = [
    {
        "behaviour_id": "WB-001",
        "behaviour_name": "Accountability",
        "category": "Personal Effectiveness",
        "version": "1.0",
        "definition": "Taking complete ownership of outcomes, commitments, and actions without deflecting blame or making excuses.",
        "purpose": "To build organizational trust, consistency in delivery, and operational reliability across teams.",
        "why_it_matters": {
            "employee": "Establishes personal credibility and trust among peers and leadership.",
            "manager": "Ensures predictable execution and minimizes micromanagement overhead.",
            "team": "Fosters psychological reliability where members can rely on each other's commitments.",
            "organisation": "Drives operational excellence and minimizes goal slippage across departments."
        },
        "observable_behaviours": [
            "Meets agreed deadlines consistently or provides proactive advance notice.",
            "Acknowledges errors promptly and focuses on immediate resolution.",
            "Takes responsibility for project deliverables end-to-end."
        ],
        "indicators_of_strength": [
            "Owns outcomes fully when projects face unexpected obstacles.",
            "Proactively reports roadblocks before deadlines are breached.",
            "Transparently shares progress updates without prompt."
        ],
        "development_indicators": [
            "Attributes failures or delays to external factors or team members.",
            "Waits until after deadlines pass to highlight blockers.",
            "Requires continuous monitoring to ensure task completion."
        ],
        "behaviour_in_action": [
            {
                "scenario_title": "Project Milestone Delay",
                "strong_behaviour_points": ["Notifies stakeholders 48 hours early", "Presents 2 recovery solutions"],
                "needs_development_points": ["Blames external vendor for delay", "Waits for manager to ask for status"]
            }
        ],
        "role_variations": {
            "individual_contributor": "Delivers personal tasks on time and takes ownership of work quality.",
            "team_leader": "Ensures sub-team commitments are met and protects team standards.",
            "manager": "Owns department KPI outcomes and holds direct reports accountable fairly.",
            "senior_leader": "Drives organizational accountability culture and models strategic ownership."
        },
        "business_impact": {
            "employee_impact": "Accelerates career growth and trust equity within the organization.",
            "manager_impact": "Allows delegation of high-impact strategic initiatives with confidence.",
            "team_impact": "Reduces friction and rework across project workstreams.",
            "organisation_impact": "Directly impacts overall organizational execution speed and output quality."
        },
        "development_objective": "8-12 week baseline: Establish transparent progress tracking, proactive blocker communication, and full ownership of milestone commitments.",
        "development_journey": {
            "stage_1_awareness": "Self-audit personal commitment delivery and identify patterns of deflection.",
            "stage_2_guided_practice": "Use structured weekly check-ins with manager to report status and blockers proactively.",
            "stage_3_workplace_application": "Lead a multi-week initiative holding full ownership of success and risk mitigations.",
            "stage_4_reinforcement": "Mentor peers on proactive accountability and transparent project tracking."
        },
        "employee_activities": [
            "Maintain a daily priority log with clear owner and target completion dates.",
            "Send weekly summary emails to stakeholders covering wins, blockers, and next steps.",
            "Conduct a self-retro after every project failure to extract personal key learnings."
        ],
        "manager_coaching_guide": [
            "Ask outcome-focused questions rather than micromanaging execution steps.",
            "Reward transparent early reporting of mistakes or delays.",
            "Set clear, explicit expectations for deliverables upfront."
        ],
        "progress_indicators": [
            "Zero unannounced deadline breaches over a 30-day period.",
            "Increase in proactive stakeholder updates.",
            "Demonstrated ownership during project retrospectives."
        ],
        "evidence_of_improvement": [
            "Positive feedback from cross-functional partners regarding reliability.",
            "Reduction in required manager follow-ups on assigned tasks."
        ],
        "reflection_questions": {
            "employee_reflection": [
                "When a deliverable fell behind schedule recently, how did I communicate it?",
                "What step can I take today to increase my team's trust in my commitments?"
            ],
            "manager_reflection": [
                "Have I clearly defined what success looks like for this employee?",
                "Do I create a safe environment for reporting blockers early?"
            ]
        },
        "common_coaching_mistakes": [
            "Focusing solely on punishment when deadlines are missed rather than root-cause solving.",
            "Failing to set explicit deadlines and expectations upfront."
        ],
        "mastery_levels": [
            {"level": 1, "title": "Reactive", "description": "Fulfills tasks when monitored; blames circumstances when outcomes fail."},
            {"level": 2, "title": "Developing", "description": "Meets basic expectations but occasionally hesitates to admit mistakes."},
            {"level": 3, "title": "Proficient", "description": "Consistently owns personal deliverables and communicates blockers proactively."},
            {"level": 4, "title": "Advanced", "description": "Fosters accountability in peers and handles complex ambiguous projects reliably."},
            {"level": 5, "title": "Role Model", "description": "Shapes organizational accountability culture and sets benchmark standards."
            }
        ],
        "ai_recommendation_logic": {
            "priority_triggers": ["SCP_LOW", "ACCOUNTABILITY_GAP", "MISSED_DEADLINES", "DEFLECTION_PATTERN"],
            "exclusion_criteria": ["ACCOUNTABILITY_HIGH", "OVER_OWNERSHIP_BURNOUT"]
        },
        "lifecycle_applicability": [
            {"talent_process": "Onboarding", "contribution": "Sets early standard for self-direction and commitment adherence."},
            {"talent_process": "Performance Review", "contribution": "Core metric for evaluating operational reliability."}
        ],
        "behaviour_summary": "Accountability is the bedrock of personal effectiveness, ensuring employees own their work and commitments end-to-end."
    }
]

# Helper function to generate generic template entries for WB-002 through WB-032 ensuring full completeness
CATEGORIES_MAP = [
    # Category 1: Personal Effectiveness
    ("WB-001", "Accountability", "Personal Effectiveness"),
    ("WB-002", "Ownership & Initiative", "Personal Effectiveness"),
    ("WB-003", "Adaptability & Resilience", "Personal Effectiveness"),
    ("WB-004", "Emotional Intelligence & Self-Awareness", "Personal Effectiveness"),
    ("WB-005", "Time & Energy Management", "Personal Effectiveness"),
    ("WB-006", "Continuous Learning & Growth Mindset", "Personal Effectiveness"),
    
    # Category 2: Communication & Collaboration
    ("WB-007", "Active Listening & Empathy", "Communication & Collaboration"),
    ("WB-008", "Clear & Influential Communication", "Communication & Collaboration"),
    ("WB-009", "Constructive Feedback & Difficult Conversations", "Communication & Collaboration"),
    ("WB-010", "Teamwork & Cross-Functional Collaboration", "Communication & Collaboration"),
    ("WB-011", "Conflict Resolution & De-escalation", "Communication & Collaboration"),
    ("WB-012", "Stakeholder Alignment", "Communication & Collaboration"),
    
    # Category 3: Thinking & Problem Solving
    ("WB-013", "Analytical Thinking & Data-Driven Decision Making", "Thinking & Problem Solving"),
    ("WB-014", "Critical Thinking & Problem Solving", "Thinking & Problem Solving"),
    ("WB-015", "Strategic Vision & Big-Picture Thinking", "Thinking & Problem Solving"),
    ("WB-016", "Innovation & Creative Thinking", "Thinking & Problem Solving"),
    ("WB-017", "Risk Assessment & Mitigation", "Thinking & Problem Solving"),
    ("WB-018", "Decision-Making Under Ambiguity", "Thinking & Problem Solving"),
    
    # Category 4: Leadership & People Development
    ("WB-019", "Coaching & Mentorship", "Leadership & People Development"),
    ("WB-020", "Delegation & Empowerment", "Leadership & People Development"),
    ("WB-021", "Performance Management & Accountability", "Leadership & People Development"),
    ("WB-022", "Talent Nurturing & Succession Planning", "Leadership & People Development"),
    ("WB-023", "Psychological Safety & Team Culture", "Leadership & People Development"),
    ("WB-024", "Inclusivity & Diversity Championing", "Leadership & People Development"),
    
    # Category 5: Leadership & Business Effectiveness
    ("WB-025", "Strategic Execution & Operational Excellence", "Leadership & Business Effectiveness"),
    ("WB-026", "Change Management & Transformation", "Leadership & Business Effectiveness"),
    ("WB-027", "Customer & Client Centricity", "Leadership & Business Effectiveness"),
    ("WB-028", "Resource Optimization & Efficiency", "Leadership & Business Effectiveness"),
    ("WB-029", "Commercial Acumen & Business Focus", "Leadership & Business Effectiveness"),
    
    # Category 6: Personal & Professional Effectiveness
    ("WB-030", "Integrity & Ethical Conduct", "Personal & Professional Effectiveness"),
    ("WB-031", "Influence Without Authority", "Personal & Professional Effectiveness"),
    ("WB-032", "Crisis Leadership & Agility", "Personal & Professional Effectiveness")
]

def generate_full_wbil_catalog():
    """Generates all 32 WBIL behavior objects with complete required schemas."""
    catalog = [WBIL_MASTER_BEHAVIOURS[0]] # Include WB-001 detailed entry
    
    for b_id, b_name, cat in CATEGORIES_MAP[1:]:
        trigger_code = b_name.upper().replace(" ", "_").replace("&", "AND")
        entry = {
            "behaviour_id": b_id,
            "behaviour_name": b_name,
            "category": cat,
            "version": "1.0",
            "definition": f"Demonstrates high competence in {b_name.lower()}, driving effective workplace results and team collaboration within {cat.lower()}.",
            "purpose": f"To optimize organizational capability in {b_name.lower()} across operational and strategic initiatives.",
            "why_it_matters": {
                "employee": f"Enhances individual impact and skill mastery in {b_name.lower()}.",
                "manager": f"Enables smoother delegation and execution alignment for {b_name.lower()}.",
                "team": f"Strengthens team synergy and collective competence in {b_name.lower()}.",
                "organisation": f"Builds scalable business performance and culture around {b_name.lower()}."
            },
            "observable_behaviours": [
                f"Consistently applies principles of {b_name.lower()} in daily tasks.",
                f"Models positive practices of {b_name.lower()} during team interactions.",
                f"Proactively addresses challenges related to {b_name.lower()}."
            ],
            "indicators_of_strength": [
                f"Displays advanced skill and confidence in {b_name.lower()}.",
                f"Serves as a go-to peer resource for {b_name.lower()} support.",
                f"Delivers high-quality outcomes consistently in {b_name.lower()}."
            ],
            "development_indicators": [
                f"Struggles to consistently maintain standards in {b_name.lower()}.",
                f"Requires manager intervention to guide {b_name.lower()} efforts.",
                f"Shows inconsistency under high-pressure scenarios for {b_name.lower()}."
            ],
            "behaviour_in_action": [
                {
                    "scenario_title": f"Workplace Application Scenario for {b_name}",
                    "strong_behaviour_points": [
                        f"Proactively leads efforts in {b_name.lower()}",
                        "Communicates clearly and aligns with team goals"
                    ],
                    "needs_development_points": [
                        f"Hesitates to apply {b_name.lower()} effectively",
                        "Relies on reactive responses rather than structured planning"
                    ]
                }
            ],
            "role_variations": {
                "individual_contributor": f"Applies {b_name.lower()} to personal assignments and daily deliverables.",
                "team_leader": f"Guides peers and ensures sub-team alignment around {b_name.lower()}.",
                "manager": f"Structures team processes and coaches direct reports on {b_name.lower()}.",
                "senior_leader": f"Drives enterprise strategy and organizational standards for {b_name.lower()}."
            },
            "business_impact": {
                "employee_impact": f"Improves professional reputation and delivery quality in {b_name.lower()}.",
                "manager_impact": f"Reduces management friction and operational bottlenecks in {b_name.lower()}.",
                "team_impact": f"Enhances collective productivity and collaboration in {b_name.lower()}.",
                "organisation_impact": f"Strengthens overall competitive advantage and execution speed in {b_name.lower()}."
            },
            "development_objective": f"8-12 week baseline: Build consistent mastery in {b_name.lower()} through structured practice, feedback loops, and practical workplace application.",
            "development_journey": {
                "stage_1_awareness": f"Understand core principles and baseline strengths/gaps in {b_name.lower()}.",
                "stage_2_guided_practice": f"Engage in weekly coaching syncs to practice techniques for {b_name.lower()}.",
                "stage_3_workplace_application": f"Apply {b_name.lower()} directly to live business tasks and projects.",
                "stage_4_reinforcement": f"Sustain progress and share best practices in {b_name.lower()} with team members."
            },
            "employee_activities": [
                f"Complete weekly self-reflections on {b_name.lower()} progress.",
                f"Seek targeted feedback from manager and peers on {b_name.lower()}.",
                f"Apply structured framework for {b_name.lower()} during key project phases."
            ],
            "manager_coaching_guide": [
                f"Set clear monthly development milestones for {b_name.lower()}.",
                f"Provide real-time actionable feedback following key events involving {b_name.lower()}.",
                f"Pair employee with a strong mentor in {b_name.lower()} for peer learning."
            ],
            "progress_indicators": [
                f"Noticeable increase in delivery quality for {b_name.lower()} tasks.",
                f"Positive feedback from cross-functional collaborators regarding {b_name.lower()}.",
                f"Demonstrated self-correction and proactive application of {b_name.lower()}."
            ],
            "evidence_of_improvement": [
                f"Sustained performance metrics over a 60-day evaluation period for {b_name.lower()}.",
                f"Independent execution of complex tasks requiring {b_name.lower()}."
            ],
            "reflection_questions": {
                "employee_reflection": [
                    f"How effectively did I demonstrate {b_name.lower()} this week?",
                    f"What key obstacle hindered my progress in {b_name.lower()}, and how can I overcome it?"
                ],
                "manager_reflection": [
                    f"How can I provide better stretch opportunities for this employee in {b_name.lower()}?",
                    f"Have I recognized and reinforced positive behaviors in {b_name.lower()}?"
                ]
            },
            "common_coaching_mistakes": [
                f"Expecting instant mastery without providing sufficient practice time for {b_name.lower()}.",
                f"Failing to link {b_name.lower()} development to tangible business outcomes."
            ],
            "mastery_levels": [
                {"level": 1, "title": "Novice", "description": f"Basic awareness of {b_name.lower()}; needs continuous guidance."},
                {"level": 2, "title": "Developing", "description": f"Applies {b_name.lower()} in routine situations; occasional inconsistency."},
                {"level": 3, "title": "Proficient", "description": f"Consistently demonstrates {b_name.lower()} in standard workplace scenarios."},
                {"level": 4, "title": "Advanced", "description": f"Excels in {b_name.lower()} even in complex or high-pressure situations."},
                {"level": 5, "title": "Master", "description": f"Role model and thought leader in {b_name.lower()}; inspires enterprise excellence."}
            ],
            "ai_recommendation_logic": {
                "priority_triggers": [f"{trigger_code}_GAP", f"{cat.upper().replace(' ', '_')}_TRIGGER", f"{b_id}_TRIGGER"],
                "exclusion_criteria": [f"{trigger_code}_HIGH", f"{b_id}_MASTERY"]
            },
            "lifecycle_applicability": [
                {"talent_process": "Onboarding", "contribution": f"Establishes baseline expectations for {b_name.lower()}."},
                {"talent_process": "Performance Review", "contribution": f"Key evaluation dimension for {b_name.lower()} competency."}
            ],
            "behaviour_summary": f"{b_name} is a key behavioral competency in the {cat} domain essential for workplace excellence."
        }
        catalog.append(entry)
    
    return catalog
