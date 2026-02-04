"""QA Feedback API - Submit feedback directly to Google Sheets."""

import json
import os
from datetime import datetime
from typing import Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter(prefix="/api/qa", tags=["qa-feedback"])


class QAFeedbackItem(BaseModel):
    """Single feedback item from QA checklist."""

    category: str
    item: str
    status: str  # pass, fail, skip
    notes: str = ""


class QAFeedbackSubmission(BaseModel):
    """Complete QA feedback submission."""

    tester_name: str
    tester_email: str = ""
    device: str
    browser: str
    test_date: str = ""
    environment: str = "staging"
    overall_score: int = 0
    items: list[QAFeedbackItem] = []
    general_comments: str = ""


def get_sheets_service():
    """Get authenticated Google Sheets service."""
    import base64

    try:
        from google.oauth2 import service_account
        from googleapiclient.discovery import build
    except ImportError:
        raise HTTPException(
            status_code=500,
            detail="Google API libraries not installed. Run: pip install google-api-python-client google-auth",
        )

    # Try base64-encoded credentials first, then plain JSON
    creds_b64 = os.getenv("GOOGLE_SHEETS_CREDENTIALS_B64")
    creds_json = os.getenv("GOOGLE_SHEETS_CREDENTIALS")

    if creds_b64:
        try:
            creds_json = base64.b64decode(creds_b64).decode("utf-8")
        except Exception:
            raise HTTPException(status_code=500, detail="Invalid GOOGLE_SHEETS_CREDENTIALS_B64")

    if not creds_json:
        raise HTTPException(
            status_code=500,
            detail="GOOGLE_SHEETS_CREDENTIALS or GOOGLE_SHEETS_CREDENTIALS_B64 not set",
        )

    try:
        creds_info = json.loads(creds_json)
        creds = service_account.Credentials.from_service_account_info(
            creds_info, scopes=["https://www.googleapis.com/auth/spreadsheets"]
        )
        return build("sheets", "v4", credentials=creds)
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="Invalid GOOGLE_SHEETS_CREDENTIALS JSON")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to authenticate: {str(e)}")


@router.post("/feedback")
async def submit_qa_feedback(submission: QAFeedbackSubmission) -> dict[str, Any]:
    """Submit QA feedback to Google Sheets."""
    sheet_id = os.getenv("QA_SHEET_ID")
    if not sheet_id:
        raise HTTPException(status_code=500, detail="QA_SHEET_ID environment variable not set")

    service = get_sheets_service()

    # Prepare row data
    test_date = submission.test_date or datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    # Summary row
    summary_row = [
        test_date,
        submission.tester_name,
        submission.tester_email,
        submission.device,
        submission.browser,
        submission.environment,
        submission.overall_score,
        len([i for i in submission.items if i.status == "pass"]),
        len([i for i in submission.items if i.status == "fail"]),
        len([i for i in submission.items if i.status == "skip"]),
        submission.general_comments,
    ]

    try:
        # Append to main sheet (工作表1)
        service.spreadsheets().values().append(
            spreadsheetId=sheet_id,
            range="工作表1!A:K",
            valueInputOption="RAW",
            insertDataOption="INSERT_ROWS",
            body={"values": [summary_row]},
        ).execute()

        return {
            "success": True,
            "message": "Feedback submitted successfully",
            "summary": {
                "tester": submission.tester_name,
                "date": test_date,
                "pass": len([i for i in submission.items if i.status == "pass"]),
                "fail": len([i for i in submission.items if i.status == "fail"]),
            },
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to write to sheet: {str(e)}")


@router.get("/health")
async def qa_health_check() -> dict[str, Any]:
    """Check if QA feedback system is configured."""
    sheet_id = os.getenv("QA_SHEET_ID")
    creds = os.getenv("GOOGLE_SHEETS_CREDENTIALS") or os.getenv("GOOGLE_SHEETS_CREDENTIALS_B64")

    return {
        "sheet_configured": bool(sheet_id),
        "credentials_configured": bool(creds),
        "ready": bool(sheet_id and creds),
    }
