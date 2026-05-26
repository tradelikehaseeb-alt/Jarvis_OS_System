"""API gateway exception types — no HTTP handlers until Phase 4."""


class JarvisApiException(Exception):
    """Base API gateway error; mapped to ApiErrorResponse in Phase 4."""

    def __init__(
        self,
        code: str,
        message: str,
        *,
        status_code: int = 400,
        details: dict | None = None,
    ) -> None:
        super().__init__(message)
        self.code = code
        self.message = message
        self.status_code = status_code
        self.details = details
