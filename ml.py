# GLOBAL PARAMS

MODEL_SLIDER_BLENDING_FACTOR = 0.7 #(e.g. 0.7 → 70% trust model baseline, 30% user preference).

##################################


def ai_summary_gen(s_base, s_infra, s_env, s_econ, w_infra, w_econ, w_env, s_user_custom_pref, description):
    import os
    from groq import Groq

    client = Groq(api_key=os.environ.get("GROQ_API_KEY"))

    # Build context from inputs
    context = f"""
    overall aggregated score(without user selected weights):
    {s_base}

    Infrastructure and proximity factors based score (weight (user selected): {w_infra}):
    {s_infra}

    Environmental and land Factors based score (weight (user selected): {w_env}):
    {s_env}

    Economic and policy drivers Factor based score (weight (user selected): {w_econ}):
    {s_econ}

    overall aggregated score (considering user selected weights for different factors):
    {s_user_custom_pref}
    
    recommendation request:
    {description}
    """


    # Strong system prompt
    messages = [
        {
            "role": "system",
            "content": """You are an expert analyst.
            Given the factors (infrastructure and proximity, environment and land, economy and policy drivers) with weights and user preferences,
            generate a concise, structured summary and also give advice based on the recommendation request.
            Keep it balanced and grounded in provided context."""
        },
        {"role": "user", "content": context}
    ]

    # Call Groq
    response = client.chat.completions.create(
        model="llama3-8b-8192",
        messages=messages,
    )

    summary = response.choices[0].message.content
    return summary


# Global dictionary to track user conversations
user_conversations = {}

def ai_report_comparision(reports_list, user_question, user_email):
    import os
    from groq import Groq

    client = Groq(api_key=os.environ.get("GROQ_API_KEY"))

    # Initialize conversation if new user
    if user_email not in user_conversations:
        reports_context = "\n".join([f"- {r['name']}: {r['summary']}" for r in reports_list])
        user_conversations[user_email] = [
            {
                "role": "system",
                "content": f"""
        You are an expert report analysis assistant. 
        Here are the reports you must always use for answering:

        {reports_context}

        Instructions:
        - Compare reports when asked.
        - Be factual, grounded, and structured.
        - Format with Key Findings, Comparisons, Recommendations.
        - If a question is unrelated to these reports, politely decline.
        """
            }
        ]

    conversation = user_conversations[user_email]

    # Add user message
    conversation.append({"role": "user", "content": user_question})

    # Call Groq API
    response = client.chat.completions.create(
        model="llama3-8b-8192",
        messages=conversation,
    )

    reply = response.choices[0].message.content

    # Store assistant reply in conversation
    conversation.append({"role": "assistant", "content": reply})

    return reply


def calc_infrastructure(curr_range, curr_lat, curr_lon):


    s_infra = 0.9
    return s_infra      # return a score between 0 and 1

def calc_environment():
    s_env = 0.8
    return s_env

def calc_economic():
    s_econ = 0.7
    return s_econ

def baseline_aggregate(s_infra, s_env, s_econ):
    s_final = (s_infra + s_env + s_econ)/3
    return s_final


def slider_weighted_aggregate(s_final, s_infra, s_env, s_econ, w_infra, w_econ, w_env, blending_factor):
    # normalize weights so they sum to 1
    weight_sum = w_infra + w_econ + w_env
    w_infra /= weight_sum
    w_econ /= weight_sum
    w_env /= weight_sum

    weighted_components = w_infra * s_infra + w_env * s_env + w_econ * s_econ
    s_final_weighted = blending_factor * s_final + (1 - blending_factor) * weighted_components
    return s_final_weighted


from fastapi import FastAPI, HTTPException, Request, Header, Depends
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()
print("FastAPI starting up")

app = FastAPI()

print("FastAPI started")


@app.get("/")
async def root():
    return {"message": "entered root", "status": "healthy"}

@app.get("/health")
async def root():
    return {"message": "FastAPI server is running", "status": "healthy"}

@app.post("/analyse")
async def root(request: Request):
    data = await request.json()

    #requests
    w_infra = data.get("w_infra", 1)
    w_econ = data.get("w_econ", 1)
    w_env = data.get("w_env", 1)
    curr_range = data.get("curr_range")
    curr_lat = data.get("curr_lat")
    curr_lon = data.get("curr_lon")
    description = data.get("description")

    s_infra = calc_infrastructure(curr_range, curr_lat, curr_lon)
    s_env = calc_environment()
    s_econ = calc_economic()
    s_base = baseline_aggregate(s_infra, s_env, s_econ)


    s_user_custom_pref = slider_weighted_aggregate(s_base, s_infra, s_env, s_econ, w_infra, w_econ, w_env, MODEL_SLIDER_BLENDING_FACTOR)

    ai_summary = ai_summary_gen(s_base, s_infra, s_env, s_econ, w_infra, w_econ, w_env, s_user_custom_pref, description)

    #response
    return {
        "s_infra":f"{s_infra}",
        "s_env":f"{s_env}",
        "s_econ":f"{s_econ}",
        "s_base":f"{s_base}",
        "s_user_custom_pref":f"{s_user_custom_pref}",
        "ai_summary":f"{ai_summary}"
    }


@app.post("/reports")
async def root(request: Request):
    data = await request.json()

    # requests
    reports_list = data.get("reports")
    user_question = data.get("user_question")
    user_email = data.get("user_email")

    res = ai_report_comparision(reports_list, user_question, user_email)

    return {"msg": res}