"""Minimal in-memory versions for safe graph updates."""

from dataclasses import dataclass
from typing import Any


@dataclass(frozen=True)
class GraphVersion:
    version_id: str
    data: dict[str, Any]


class VersionStore:
    """Keep immutable snapshots and choose one as the active version."""

    def __init__(self) -> None:
        self._versions: dict[str, GraphVersion] = {}
        self._active: str | None = None

    def save(self, version_id: str, data: dict[str, Any]) -> GraphVersion:
        if not version_id.strip():
            raise ValueError("version_id is required")
        if version_id in self._versions:
            raise ValueError(f"Version already exists: {version_id}")
        version = GraphVersion(version_id, dict(data))
        self._versions[version_id] = version
        if self._active is None:
            self._active = version_id
        return version

    def activate(self, version_id: str) -> GraphVersion:
        try:
            version = self._versions[version_id]
        except KeyError as error:
            raise KeyError(f"Unknown graph version: {version_id}") from error
        self._active = version_id
        return version

    def active(self) -> GraphVersion:
        if self._active is None:
            raise LookupError("No graph version has been saved")
        return self._versions[self._active]
