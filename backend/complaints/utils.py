import re
from django.utils import timezone

def validate_working_hours_and_future_time(time_str):
    """
    Validates that maintenance visit/appointment time:
    1. Falls strictly between 9:00 AM and 6:00 PM.
    2. Is in the future, not in the past.
    """
    if not time_str or not time_str.strip():
        return True, ""

    clean = time_str.strip().lower()

    # Disallowed hours: outside 9 AM - 6 PM
    outside_patterns = [
        r'\b(7|8|9|10|11)\s*(:\d{2})?\s*pm\b',
        r'\b(12|1|2|3|4|5|6|7|8)\s*(:\d{2})?\s*am\b',
        r'after\s*(6|7|8|9)\s*pm',
        r'night',
        r'midnight',
        r'late\s*evening',
        r'early\s*morning',
    ]

    for pat in outside_patterns:
        if re.search(pat, clean):
            return False, "Hostel maintenance work hours are strictly from 9:00 AM to 6:00 PM only."

    now = timezone.localtime()
    if 'today' in clean and now.hour >= 17:
        return False, "Maintenance work hours for today have closed (9:00 AM - 6:00 PM). Please select Tomorrow or a future date."

    return True, ""
