from fastapi.middleware.cors import CORSMiddleware



# GLOBAL PARAMS

MODEL_SLIDER_BLENDING_FACTOR = 0.7  # (e.g. 0.7 → 70% trust model baseline, 30% user preference).

ASSETS_API = "http://192.168.1.6:8000/api/assets/list/" # get request to get list of assets
##################################


def ai_summary_gen(s_xgboost_aggregate, s_infra, s_env, s_econ, s_avg, w_infra, w_econ, w_env, s_user_custom_pref, description):
    try:
        import os
        from groq import Groq

        # Check if API key exists
        api_key = os.environ.get("GROQ_API_KEY")
        if not api_key:
            return "AI Summary unavailable: GROQ_API_KEY not found in environment variables"

        client = Groq(api_key=api_key)

        # Build context from inputs
        context = f"""
        average of scores from all factors (without user selected weights):
        {s_avg}
        
        our ai system's recommended score:
        {s_xgboost_aggregate}
        
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

    except Exception as e:
        print(f"Error in ai_summary_gen: {e}")
        return f"AI Summary generation failed: {str(e)}"


# Global dictionary to track user conversations
user_conversations = {}


def ai_report_comparision(reports_list, user_question, user_email):
    try:
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

    except Exception as e:
        print(f"Error in ai_report_comparision: {e}")
        return f"Report comparison failed: {str(e)}"


import math


def haversine(lat1, lon1, lat2, lon2):
    # Earth radius in km
    R = 6371

    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)

    a = (math.sin(dlat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(dlon / 2) ** 2)

    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c  # distance in km

import requests
def get_assets():
    try:
        print("entering get_assets")
        response = requests.get(ASSETS_API)
        data = response.json()
        assets = []
        for asset in data:
            assets.append(
                {"latitude" : asset["location"]["coordinates"][1],
                 "longitude" : asset["location"]["coordinates"][0],
                 "category" : asset["category"],
                 "capex" : float(asset["capexEstimate"]),
                 "opex" : float(asset["opexEstimate"])
                 }
            )
        # print(assets)
        return assets
    except:
        print("Error in get_assets")


def get_nearby_assets(user_lat, user_lon, radius_km, top_k=15):
    current_categories_allowed = ["Hydrogen Plants", "Hydrogen Storage Facilities (tanks, underground storage, others)", "Hydrogen Distribution Hubs (refuelling stations, industrial hubs, others", "Ports (import/export potential)", "Airports/Railway Stations",
                                  "Renewable Energy Farms (solar, wind, hydro, biomass, others)"]

    unfiltered_assets = get_assets()
    assets = [a for a in unfiltered_assets if a["category"] in current_categories_allowed]


    # assets = [
    #     # Hydrogen Plants - spread across realistic distances
    #     {"latitude": 12.9712, "longitude": 77.5946, "category": "Hydrogen Plants"},  # ~1.5km
    #     {"latitude": 12.9800, "longitude": 77.6000, "category": "Hydrogen Plants"},  # ~3.5km
    #     {"latitude": 12.9600, "longitude": 77.5700, "category": "Hydrogen Plants"},  # ~3.8km
    #     {"latitude": 12.9900, "longitude": 77.6200, "category": "Hydrogen Plants"},  # ~6.2km
    #     {"latitude": 12.9711, "longitude": 77.5945, "category": "Hydrogen Plants"},  # ~1.5km
    #     {"latitude": 12.9710, "longitude": 77.5944, "category": "Hydrogen Plants"},  # ~1.5km
    #
    #     # Hydrogen Storage - various distances
    #     {"latitude": 12.9713, "longitude": 77.5947, "category": "Hydrogen Storage"},  # ~1.4km
    #     {"latitude": 12.9650, "longitude": 77.5800, "category": "Hydrogen Storage"},  # ~2.8km
    #     {"latitude": 12.9850, "longitude": 77.6100, "category": "Hydrogen Storage"},  # ~5.1km
    #
    #     # Other categories...
    #     {"latitude": 12.9715, "longitude": 77.5944, "category": "Hydrogen Distribution Hub"},
    #     {"latitude": 12.9716, "longitude": 77.5946, "category": "Ports"},
    #     {"latitude": 12.9714, "longitude": 77.5945, "category": "Airports/Railway Stations"},
    # ]

    nearby_assets = []

    for asset in assets:
        dist = haversine(user_lat, user_lon, asset["latitude"], asset["longitude"])
        if dist <= radius_km:
            nearby_assets.append((asset, dist))

    # Sort by distance
    nearby_assets.sort(key=lambda x: x[1])

    # Return top k
    return nearby_assets[:top_k]


import math

import math

def calc_infrastructure(curr_range, curr_lat, curr_lon):
    try:
        results = get_nearby_assets(
            user_lat=curr_lat,
            user_lon=curr_lon,
            radius_km=curr_range,
            top_k=15
        )
        print(f"Infrastructure results: {results}")
        print(f"infra assets: {len(results)}")

        if not results:
            return 0.0  # No nearby infrastructure

        total_score = 0.0
        max_distance = curr_range

        for asset, distance in results:
            # More moderate exponential distance weighting
            weight = math.exp(-distance / (max_distance * 0.5))  # Changed from 0.3 to 0.5
            total_score += weight

        n_assets = len(results)

        if n_assets == 1:
            # One asset → max 0.3, scaled by distance
            max_possible_score = 1.0
            base_score = total_score / max_possible_score
            normalized_score = min(0.3, base_score * 0.3)

        elif n_assets == 2:
            # Two assets → around 0.5 (50%), affected by distance
            max_possible_score = 2.0
            base_score = total_score / max_possible_score  # 0–1
            normalized_score = 0.4 + 0.2 * base_score      # Range: 0.4–0.6 (40-60%)

        elif n_assets >= 3:
            # 3+ assets → starts at 0.55, grows up to 1.0, affected by distance
            max_possible_score = n_assets * 1.0
            base_score = min(1.0, total_score / max_possible_score)
            normalized_score = 0.55 + 0.45 * base_score

        else:
            normalized_score = 0.0

        print(f"infra score: {normalized_score}")
        return normalized_score

    except Exception as e:
        print(f"Error in calc_infrastructure: {e}")
        return 0.5  # fallback score

def get_nearby_environmental_assets(user_lat, user_lon, radius_km):
    """Get all environmental and land-related assets within radius"""
    current_categories_allowed = ["Land Suitability - Residencial", "Land Suitability - Industrial", "Land Suitability - Forest",
                                  "Water Sources (rivers, reservoirs, groundwater, others)", "Natural Disaster Resilient Zone",
                                  "Natural Disaster Prone Zone", "National Park / Biodiversity Zone", "Restricted/Protected Zone"]

    unfiltered_assets = get_assets()
    assets = [a for a in unfiltered_assets if a["category"] in current_categories_allowed]

    # assets = [
    #     # Land Suitability assets
    #     {"latitude": 12.9712, "longitude": 77.5946, "category": "Land Suitability - Industrial"},
    #     {"latitude": 12.9800, "longitude": 77.6000, "category": "Land Suitability - Industrial"},
    #     {"latitude": 12.9650, "longitude": 77.5800, "category": "Land Suitability - Industrial"},
    #     {"latitude": 12.9750, "longitude": 77.5900, "category": "Land Suitability - Industrial"},
    #
    #
    #
    #
    #     # Water sources
    #     {"latitude": 12.9713, "longitude": 77.5947,
    #      "category": "Water Sources (rivers, reservoirs, groundwater, others)"},
    #     {"latitude": 12.9780, "longitude": 77.5980,
    #      "category": "Water Sources (rivers, reservoirs, groundwater, others)"},
    #     {"latitude": 12.9620, "longitude": 77.5720,
    #      "category": "Water Sources (rivers, reservoirs, groundwater, others)"},
    #
    #     {"latitude": 12.9840, "longitude": 77.6025, "category": "Natural Disaster Resilient Zone"},
    #     {"latitude": 12.9760, "longitude": 77.5960, "category": "Natural Disaster Resilient Zone"},
    #     {"latitude": 12.9820, "longitude": 77.6020, "category": "Natural Disaster Resilient Zone"},
    # ]

    nearby_assets = []
    for asset in assets:
        dist = haversine(user_lat, user_lon, asset["latitude"], asset["longitude"])
        if dist <= radius_km:
            nearby_assets.append((asset, dist))

    return nearby_assets


def calc_environment(curr_range, curr_lat, curr_lon):
    """
    Calculate Environmental & Land Factors score (0-1)

    Components:
    12) Land Suitability Score (0-0.3)
    13) Zoning Restriction Penalty (0-0.2)
    14) Water Availability Index (0-0.2)
    15) Climate Resilience Score (0-0.15)
    16) Environmental Restriction Penalty (0-0.15)
    """
    try:
        assets = get_nearby_environmental_assets(curr_lat, curr_lon, curr_range)
        print(f"enviro results: {assets}")
        print(f"enviro assets:{len(assets)}")
        # Initialize scores
        land_suitability_score = 0.0
        zoning_penalty = 0.0
        water_availability_score = 0.0
        climate_resilience_score = 0.0
        environmental_penalty = 0.0

        # Count assets by category
        asset_counts = {}
        closest_distances = {}

        for asset, distance in assets:
            category = asset["category"]
            asset_counts[category] = asset_counts.get(category, 0) + 1

            # Track closest distance for each category
            if category not in closest_distances or distance < closest_distances[category]:
                closest_distances[category] = distance

        # 12) Land Suitability Score (max 0.3 points)
        industrial_count = asset_counts.get("Land Suitability - Industrial", 0)
        residential_count = asset_counts.get("Land Suitability - Residencial", 0)
        forest_count = asset_counts.get("Land Suitability - Forest", 0)

        # Industrial land is best, residential has small penalty, forest has high penalty
        land_suitability_score = min(0.3, industrial_count * 0.15)  # Up to 0.3 for 2+ industrial
        land_suitability_score -= residential_count * 0.02  # Small penalty per residential
        land_suitability_score -= forest_count * 0.08  # High penalty per forest
        land_suitability_score = max(0.0, land_suitability_score)  # Don't go below 0

        # 13) Zoning Restriction Penalty (max -0.2 points)
        restricted_count = asset_counts.get("Restricted/Protected Zone", 0)
        if restricted_count > 0:
            # Apply penalty based on proximity to restricted zone
            closest_restricted = closest_distances.get("Restricted/Protected Zone", curr_range)
            # Higher penalty for closer proximity
            proximity_factor = 1.0 - (closest_restricted / curr_range)  # 0-1, higher = closer
            zoning_penalty = proximity_factor * 0.2  # Max penalty 0.2

        # 14) Water Availability Index (max 0.2 points)
        water_count = asset_counts.get("Water Sources (rivers, reservoirs, groundwater, others)", 0)
        if water_count > 0:
            # Score based on number of water sources and proximity
            closest_water = closest_distances.get("Water Sources (rivers, reservoirs, groundwater, others)", curr_range)
            proximity_factor = 1.0 - (closest_water / curr_range)  # Closer = better
            water_availability_score = min(0.2, (water_count * 0.1 + proximity_factor * 0.1))

        # 15) Climate Resilience Score (max 0.15 points)
        resilient_count = asset_counts.get("Natural Disaster Resilient Zone", 0)
        prone_count = asset_counts.get("Natural Disaster Prone Zone", 0)

        climate_resilience_score = min(0.15, resilient_count * 0.08)  # Bonus for resilient zones
        if prone_count > 0:
            # Apply penalty for disaster-prone zones
            closest_prone = closest_distances.get("Natural Disaster Prone Zone", curr_range)
            proximity_factor = 1.0 - (closest_prone / curr_range)
            climate_resilience_score -= proximity_factor * 0.1  # Penalty for proximity to prone zones

        climate_resilience_score = max(0.0, climate_resilience_score)

        # 16) Environmental Restriction Penalty (max -0.15 points)
        biodiversity_count = asset_counts.get("National Park / Biodiversity Zone", 0)
        if biodiversity_count > 0:
            # Apply penalty based on proximity to protected environmental zones
            closest_biodiversity = closest_distances.get("National Park / Biodiversity Zone", curr_range)
            proximity_factor = 1.0 - (closest_biodiversity / curr_range)
            environmental_penalty = proximity_factor * 0.15  # Max penalty 0.15

        # Calculate final score
        final_score = (land_suitability_score +
                       water_availability_score +
                       climate_resilience_score -
                       zoning_penalty -
                       environmental_penalty)

        # Ensure score is between 0 and 1
        final_score = max(0.0, min(1.0, final_score))

        print(f"Environmental scoring breakdown:")
        print(f"  Land Suitability: {land_suitability_score:.3f}")
        print(f"  Water Availability: {water_availability_score:.3f}")
        print(f"  Climate Resilience: {climate_resilience_score:.3f}")
        print(f"  Zoning Penalty: -{zoning_penalty:.3f}")
        print(f"  Environmental Penalty: -{environmental_penalty:.3f}")
        print(f"  Final Score: {final_score:.3f}")

        return final_score

    except Exception as e:
        print(f"Error in calc_environment: {e}")
        return 0.5  # fallback score

def get_nearby_economic_assets(user_lat, user_lon, radius_km):
    """Get all economic & policy related assets within radius"""

    current_categories_allowed = ["Subsidy / Incentive Zone", "Proximity to Industrial/Urban Cluster"]

    unfiltered_assets = get_assets()
    assets = [a for a in unfiltered_assets if a["category"] in current_categories_allowed]

    # assets = [
    #     # Subsidy / Incentive Zones
    #     {"latitude": 12.9710, "longitude": 77.5940, "category": "Subsidy / Incentive Zone"},
    #     {"latitude": 12.9750, "longitude": 77.5980, "category": "Subsidy / Incentive Zone"},
    #
    #     # Industrial / Urban Clusters (with CAPEX/OPEX estimates)
    #     {"latitude": 12.9650, "longitude": 77.5820,
    #      "category": "Proximity to Industrial/Urban Cluster",
    #      "capex": 100, "opex": 50},
    #     {"latitude": 12.9800, "longitude": 77.6020,
    #      "category": "Proximity to Industrial/Urban Cluster",
    #      "capex": 120, "opex": 60},
    #     {"latitude": 12.9600, "longitude": 77.5700,
    #      "category": "Proximity to Industrial/Urban Cluster",
    #      "capex": 90, "opex": 40},
    # ]

    nearby_assets = []
    for asset in assets:
        dist = haversine(user_lat, user_lon, asset["latitude"], asset["longitude"])
        if dist <= radius_km:
            nearby_assets.append((asset, dist))

    return nearby_assets


def calc_economic(curr_range, curr_lat, curr_lon):
    """
    Calculate Economic & Policy Driver score (0-1)

    Components:
    18) CAPEX/OPEX Efficiency Score (0-0.35)
    19) Regulatory Favorability Score (0-0.35)
    20) Proximity to Industrial/Urban Clusters (0-0.30)
    """
    try:
        assets = get_nearby_economic_assets(curr_lat, curr_lon, curr_range)
        print(f"enviro results: {assets}")
        print(f"econo assets:{len(assets)}")
        # Initialize scores
        capex_opex_score = 0.0
        regulatory_score = 0.0
        cluster_proximity_score = 0.0

        asset_counts = {}
        closest_distances = {}

        # For CAPEX/OPEX
        capex_values, opex_values = [], []

        for asset, distance in assets:
            category = asset["category"]
            asset_counts[category] = asset_counts.get(category, 0) + 1

            if category == "Proximity to Industrial/Urban Cluster":
                capex_values.append(asset.get("capex", 0))
                opex_values.append(asset.get("opex", 0))

            # Track closest distance per category
            if category not in closest_distances or distance < closest_distances[category]:
                closest_distances[category] = distance

        # --- 18) CAPEX/OPEX Efficiency Score (max 0.35) ---
        if capex_values and opex_values:
            avg_capex = sum(capex_values) / len(capex_values)
            avg_opex = sum(opex_values) / len(opex_values)

            # Lower capex/opex = better
            # Normalize with simple heuristic (you can refine with dataset stats)
            norm_capex = max(0.0, min(1.0, 200 / (avg_capex + 1)))  # assuming 200 baseline
            norm_opex = max(0.0, min(1.0, 100 / (avg_opex + 1)))    # assuming 100 baseline

            capex_opex_score = 0.35 * ((norm_capex + norm_opex) / 2)

        # --- 19) Regulatory Favorability Score (max 0.35) ---
        subsidy_count = asset_counts.get("Subsidy / Incentive Zone", 0)
        if subsidy_count > 0:
            closest_subsidy = closest_distances.get("Subsidy / Incentive Zone", curr_range)
            proximity_factor = 1.0 - (closest_subsidy / curr_range)  # closer = better
            regulatory_score = min(0.35, subsidy_count * 0.2 + proximity_factor * 0.15)

        # --- 20) Cluster Proximity Score (max 0.30) ---
        cluster_count = asset_counts.get("Proximity to Industrial/Urban Cluster", 0)
        if cluster_count > 0:
            closest_cluster = closest_distances.get("Proximity to Industrial/Urban Cluster", curr_range)
            proximity_factor = 1.0 - (closest_cluster / curr_range)
            cluster_proximity_score = min(0.30, cluster_count * 0.1 + proximity_factor * 0.2)

        # Final aggregation
        final_score = capex_opex_score + regulatory_score + cluster_proximity_score
        final_score = max(0.0, min(1.0, final_score))  # clip between 0 and 1

        print(f"Economic scoring breakdown:")
        print(f"  CAPEX/OPEX Score: {capex_opex_score:.3f}")
        print(f"  Regulatory Score: {regulatory_score:.3f}")
        print(f"  Cluster Proximity Score: {cluster_proximity_score:.3f}")
        print(f"  Final Score: {final_score:.3f}")

        return final_score

    except Exception as e:
        print(f"Error in calc_economic: {e}")
        return 0.5  # fallback score



def baseline_aggregate(s_infra, s_env, s_econ):
    s_final = (s_infra + s_env + s_econ) / 3
    return s_final


def slider_weighted_aggregate(s_final, s_infra, s_env, s_econ, w_infra, w_econ, w_env, blending_factor):
    # normalize weights so they sum to 1
    weight_sum = w_infra + w_econ + w_env
    if weight_sum == 0:
        weight_sum = 1  # prevent division by zero

    w_infra /= weight_sum
    w_econ /= weight_sum
    w_env /= weight_sum

    weighted_components = w_infra * s_infra + w_env * s_env + w_econ * s_econ
    s_final_weighted = blending_factor * s_final + (1 - blending_factor) * weighted_components
    return s_final_weighted

def xgboost_aggregate(s_infra, s_env, s_econ):
    import joblib
    import numpy as np
    model = joblib.load("xgb_recommendation_model.pkl")
    X_new = np.array([[s_infra, s_env, s_econ]])
    rec_score = model.predict(X_new)[0]
    return rec_score



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
async def health():
    return {"message": "FastAPI server is running", "status": "healthy"}


@app.post("/analyse")
async def analyse(request: Request):
    try:
        print("entered /analyse")
        data = await request.json()
        print(f"Received data: {data}")

        # Extract requests with validation
        w_infra = data.get("w_infra", 1)
        w_econ = data.get("w_econ", 1)
        w_env = data.get("w_env", 1)
        curr_range = data.get("curr_range")
        curr_lat = data.get("curr_lat")
        curr_lon = data.get("curr_lon")
        description = data.get("description")

        # Validate required parameters
        if curr_range is None or curr_lat is None or curr_lon is None:
            raise HTTPException(status_code=400, detail="Missing required parameters: curr_range, curr_lat, curr_lon")

        # Calculate scores
        s_infra = calc_infrastructure(curr_range, curr_lat, curr_lon)
        s_env = calc_environment(curr_range, curr_lat, curr_lon)
        s_econ = calc_economic(curr_range, curr_lat, curr_lon)
        s_xgboost_aggregate = xgboost_aggregate(s_infra, s_env, s_econ)
        s_avg = baseline_aggregate(s_infra, s_env, s_econ)

        s_user_custom_pref = slider_weighted_aggregate(s_xgboost_aggregate, s_infra, s_env, s_econ, w_infra, w_econ, w_env,
                                                       MODEL_SLIDER_BLENDING_FACTOR)

        ai_summary = ai_summary_gen(s_xgboost_aggregate, s_infra, s_env, s_econ, w_infra, w_econ, w_env, s_user_custom_pref,
                                    description, s_avg)

        # Response
        return {
            "s_infra": f"{s_infra}",
            "s_env": f"{s_env}",
            "s_econ": f"{s_econ}",
            "s_avg": f"{s_avg}",
            "s_xgboost_aggregate": f"{s_xgboost_aggregate}",
            "s_user_custom_pref": f"{s_user_custom_pref}",
            "ai_summary": f"{ai_summary}"
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in /analyse endpoint: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@app.post("/reports")
async def reports(request: Request):
    try:
        data = await request.json()

        # requests
        reports_list = data.get("reports")
        user_question = data.get("user_question")
        user_email = data.get("user_email")
        summary = data.get("reports")[0]['summary']
        print(f"Received data: {summary}")
        if not reports_list or not user_question or not user_email:
            raise HTTPException(status_code=400,
                                detail="Missing required parameters: reports, user_question, user_email")

        res = ai_report_comparision(reports_list, user_question, user_email)

        return {"msg": res}

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in /reports endpoint: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.get("/test")
async def test():
    print("entering test")
    return get_assets()


origins = [
    "http://localhost:8080",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For development only, restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


