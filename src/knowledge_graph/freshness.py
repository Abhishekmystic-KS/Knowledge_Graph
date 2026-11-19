"""Freshness checks for time-sensitive graph facts."""

from datetime import date


def is_fresh(
    observed_at: str,
    *,
    today: date,
    max_age_days: int,
) -> bool:
    """Return whether an ISO date is within the allowed age."""
    if max_age_days < 0:
        raise ValueError("max_age_days cannot be negative")
    try:
        observed = date.fromisoformat(observed_at)
    except ValueError as error:
        raise ValueError("observed_at must be an ISO date") from error
    age_days = (today - observed).days
    return 0 <= age_days <= max_age_days
