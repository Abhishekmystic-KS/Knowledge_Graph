"""Simple deny-by-default access checks for graph facts."""


def can_access(
    user_roles: set[str],
    required_roles: set[str],
) -> bool:
    """Return whether the user has at least one required role."""
    if not required_roles:
        raise ValueError("A fact must declare an access requirement")
    return bool(user_roles & required_roles)
