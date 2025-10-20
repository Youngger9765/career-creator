from datetime import datetime, timedelta
from uuid import UUID, uuid4

from sqlmodel import Field, SQLModel


class PasswordResetToken(SQLModel, table=True):
    """Password reset token model for forgot password flow"""

    __tablename__ = "password_reset_tokens"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    user_id: UUID = Field(foreign_key="users.id", index=True)
    token: str = Field(unique=True, index=True)
    expires_at: datetime
    used: bool = Field(default=False)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    @staticmethod
    def create_expiry_time(hours: int = 24) -> datetime:
        """Create expiry time (default 24 hours from now)"""
        return datetime.utcnow() + timedelta(hours=hours)

    def is_expired(self) -> bool:
        """Check if token has expired"""
        return datetime.utcnow() > self.expires_at

    def is_valid(self) -> bool:
        """Check if token is valid (not used and not expired)"""
        return not self.used and not self.is_expired()
