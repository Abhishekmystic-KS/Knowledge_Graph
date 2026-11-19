"""Resolve names and aliases to canonical graph entity IDs."""


class EntityLinker:
    """Resolve unambiguous aliases without silently guessing."""

    def __init__(self, aliases: dict[str, set[str]]) -> None:
        self._aliases = {
            alias.casefold(): set(node_ids)
            for alias, node_ids in aliases.items()
        }

    def resolve(self, mention: str) -> str:
        """Return one canonical ID or raise for unknown/ambiguous mentions."""
        matches = self._aliases.get(mention.casefold(), set())
        if not matches:
            raise KeyError(f"Unknown entity mention: {mention}")
        if len(matches) > 1:
            options = ", ".join(sorted(matches))
            raise ValueError(f"Ambiguous entity mention: {mention} ({options})")
        return next(iter(matches))
