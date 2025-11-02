"""
Load Test Configuration
Centralized configuration for all load testing scenarios
"""

# API Endpoints
STAGING_API = "https://career-creator-backend-staging-x43mdhfwsq-de.a.run.app"
LOCAL_API = "http://localhost:8000"

# Test User Configuration
DEFAULT_TEST_PASSWORD = "TestPassword123!"

# Test Scenarios Configuration
SCENARIOS = {
    "concurrent_rooms": {
        "description": "Test N counselors each creating a room with 1 visitor",
        "default_rooms": 100,
        "test_configs": {
            "smoke": {"rooms": 10, "description": "Quick smoke test"},
            "small": {"rooms": 50, "description": "Small load test"},
            "medium": {"rooms": 100, "description": "Medium load test (Beta target)"},
            "large": {"rooms": 200, "description": "Large load test (2x capacity)"},
            "stress": {"rooms": 500, "description": "Stress test (find limits)"},
        },
        "success_criteria": {
            "failure_rate": 0.01,  # < 1%
            "avg_response_time_ms": 1000,  # < 1000ms
            "p95_response_time_ms": 2000,  # < 2000ms
        }
    },

    "gameplay_states": {
        "description": "Test concurrent gameplay state save/load operations",
        "default_rooms": 50,
        "test_configs": {
            "smoke": {"rooms": 10, "saves_per_room": 5, "description": "Quick gameplay test"},
            "medium": {"rooms": 50, "saves_per_room": 10, "description": "Medium gameplay load"},
            "large": {"rooms": 100, "saves_per_room": 20, "description": "Large gameplay load"},
        },
        "success_criteria": {
            "failure_rate": 0.01,
            "avg_response_time_ms": 500,
            "p95_response_time_ms": 1000,
        }
    },

    "visitor_joins": {
        "description": "Test concurrent visitor joins to existing rooms",
        "default_visitors": 100,
        "test_configs": {
            "smoke": {"visitors": 10, "rooms": 5, "description": "Quick visitor test"},
            "medium": {"visitors": 100, "rooms": 50, "description": "Medium visitor load"},
            "large": {"visitors": 200, "rooms": 100, "description": "Large visitor load"},
        },
        "success_criteria": {
            "failure_rate": 0.01,
            "avg_response_time_ms": 1000,
        }
    },

    "sustained_load": {
        "description": "Sustained load test with Locust (mixed operations)",
        "default_users": 50,
        "test_configs": {
            "smoke": {"users": 10, "duration": "2m", "spawn_rate": 5},
            "medium": {"users": 50, "duration": "5m", "spawn_rate": 10},
            "large": {"users": 100, "duration": "10m", "spawn_rate": 10},
            "stress": {"users": 200, "duration": "15m", "spawn_rate": 20},
        },
        "success_criteria": {
            "failure_rate": 0.01,
            "avg_response_time_ms": 1000,
            "rps_min": 10,  # Min requests per second
        }
    }
}

# Database Configuration
DATABASE_POOL_CONFIG = {
    "current": {
        "pool_size": 30,
        "max_overflow": 30,
        "total": 60
    },
    "notes": "Configured for 100+ concurrent rooms (200 users)"
}

# System Limits
SYSTEM_LIMITS = {
    "supabase_transaction_pooler": 200,  # Port 6543
    "cloud_run_max_instances": 100,
    "cloud_run_concurrency": 80,
}

# Test User Generation
def generate_test_user_email(user_num: int) -> str:
    """Generate test user email"""
    return f"test.user{user_num}@example.com"

def get_test_user(user_num: int) -> dict:
    """Get test user credentials"""
    return {
        "email": generate_test_user_email(user_num),
        "password": DEFAULT_TEST_PASSWORD,
        "role": "counselor"
    }

# Scenario Helpers
def get_scenario_config(scenario_name: str, config_name: str = None):
    """
    Get test configuration for a scenario

    Args:
        scenario_name: Name of the scenario (e.g., "concurrent_rooms")
        config_name: Configuration name (e.g., "small", "medium", "large")
                    If None, returns default configuration

    Returns:
        dict: Test configuration
    """
    scenario = SCENARIOS.get(scenario_name)
    if not scenario:
        raise ValueError(f"Unknown scenario: {scenario_name}")

    if config_name:
        config = scenario["test_configs"].get(config_name)
        if not config:
            raise ValueError(f"Unknown config '{config_name}' for scenario '{scenario_name}'")
        return config

    # Return default config
    if "default_rooms" in scenario:
        return {"rooms": scenario["default_rooms"]}
    elif "default_users" in scenario:
        return {"users": scenario["default_users"]}
    elif "default_visitors" in scenario:
        return {"visitors": scenario["default_visitors"]}

    return {}

def print_scenario_info(scenario_name: str):
    """Print information about a test scenario"""
    scenario = SCENARIOS.get(scenario_name)
    if not scenario:
        print(f"Unknown scenario: {scenario_name}")
        return

    print(f"\n{'='*80}")
    print(f"Scenario: {scenario_name}")
    print(f"{'='*80}")
    print(f"Description: {scenario['description']}")
    print(f"\nAvailable configurations:")
    for config_name, config in scenario["test_configs"].items():
        desc = config.get('description', '')
        if desc:
            print(f"  - {config_name}: {desc}")
        else:
            print(f"  - {config_name}:")
        for key, value in config.items():
            if key != 'description':
                print(f"      {key}: {value}")
    print(f"\nSuccess Criteria:")
    for key, value in scenario["success_criteria"].items():
        print(f"  - {key}: {value}")
    print(f"{'='*80}\n")

if __name__ == "__main__":
    # Print all scenarios when run directly
    print("\n" + "="*80)
    print("Career Creator - Load Test Scenarios")
    print("="*80)

    for scenario_name in SCENARIOS.keys():
        print_scenario_info(scenario_name)
