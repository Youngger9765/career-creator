"""QA Feedback API - Submit feedback directly to Google Sheets."""

import json
import os
from datetime import datetime
from typing import Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter(prefix="/api/qa", tags=["qa-feedback"])


class QAFeedbackItem(BaseModel):
    """Single checkpoint from QA checklist."""

    section: str  # 流程名稱 (e.g., "諮詢師登入流程")
    step_id: str  # 步驟 ID (e.g., "1.3")
    step_desc: str  # 步驟描述
    expected: str  # 預期結果
    status: str  # pass, fail, skip
    bug_notes: str = ""  # Bug 描述


class QAFeedbackSubmission(BaseModel):
    """Complete QA feedback submission."""

    tester_name: str
    environment: str = "staging"
    browser: str = ""
    os: str = ""
    test_date: str = ""
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


def ensure_headers(service, sheet_id: str):
    """Check if headers exist, if not insert them at row 1."""
    # Headers for each tab
    test_headers = ["提交時間", "測試者", "環境", "瀏覽器", "OS", "流程", "步驟ID", "步驟描述", "預期結果", "狀態", "Bug描述"]
    stats_headers = ["提交時間", "測試者", "環境", "瀏覽器", "OS", "Pass", "Fail", "Skip", "備註"]

    try:
        # Check 測試 tab - if A1 is not "提交時間", insert header row
        result = service.spreadsheets().values().get(
            spreadsheetId=sheet_id,
            range="測試!A1"
        ).execute()
        values = result.get("values", [[]])
        first_cell = values[0][0] if values and values[0] else ""

        if first_cell != "提交時間":
            # Insert a new row at position 1
            service.spreadsheets().batchUpdate(
                spreadsheetId=sheet_id,
                body={"requests": [{"insertDimension": {"range": {"sheetId": 0, "dimension": "ROWS", "startIndex": 0, "endIndex": 1}}}]}
            ).execute()
            # Write headers
            service.spreadsheets().values().update(
                spreadsheetId=sheet_id,
                range="測試!A1:K1",
                valueInputOption="RAW",
                body={"values": [test_headers]}
            ).execute()

        # Check 統計 tab - need to get its sheet ID first
        sheet_metadata = service.spreadsheets().get(spreadsheetId=sheet_id).execute()
        stats_sheet_id = None
        for sheet in sheet_metadata.get("sheets", []):
            if sheet["properties"]["title"] == "統計":
                stats_sheet_id = sheet["properties"]["sheetId"]
                break

        if stats_sheet_id is not None:
            result = service.spreadsheets().values().get(
                spreadsheetId=sheet_id,
                range="統計!A1"
            ).execute()
            values = result.get("values", [[]])
            first_cell = values[0][0] if values and values[0] else ""

            if first_cell != "提交時間":
                # Insert a new row at position 1
                service.spreadsheets().batchUpdate(
                    spreadsheetId=sheet_id,
                    body={"requests": [{"insertDimension": {"range": {"sheetId": stats_sheet_id, "dimension": "ROWS", "startIndex": 0, "endIndex": 1}}}]}
                ).execute()
                # Write headers
                service.spreadsheets().values().update(
                    spreadsheetId=sheet_id,
                    range="統計!A1:I1",
                    valueInputOption="RAW",
                    body={"values": [stats_headers]}
                ).execute()
    except Exception:
        pass  # Ignore errors, headers are optional


@router.post("/feedback")
async def submit_qa_feedback(submission: QAFeedbackSubmission) -> dict[str, Any]:
    """Submit QA feedback to Google Sheets (2 tabs: 測試 + 統計)."""
    sheet_id = os.getenv("QA_SHEET_ID")
    if not sheet_id:
        raise HTTPException(status_code=500, detail="QA_SHEET_ID environment variable not set")

    service = get_sheets_service()

    # Ensure headers exist
    ensure_headers(service, sheet_id)

    # Prepare data
    test_date = submission.test_date or datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    pass_count = len([i for i in submission.items if i.status == "pass"])
    fail_count = len([i for i in submission.items if i.status == "fail"])
    skip_count = len([i for i in submission.items if i.status == "skip"])

    # 明細 rows (one per checkpoint)
    detail_rows = []
    for item in submission.items:
        detail_rows.append([
            test_date,
            submission.tester_name,
            submission.environment,
            submission.browser,
            submission.os,
            item.section,
            item.step_id,
            item.step_desc,
            item.expected,
            item.status,
            item.bug_notes,
        ])

    # 摘要 row (one per submission)
    summary_row = [
        test_date,
        submission.tester_name,
        submission.environment,
        submission.browser,
        submission.os,
        pass_count,
        fail_count,
        skip_count,
        submission.general_comments,
    ]

    try:
        # Write to 測試 tab (raw data)
        if detail_rows:
            service.spreadsheets().values().append(
                spreadsheetId=sheet_id,
                range="測試!A:K",
                valueInputOption="RAW",
                insertDataOption="INSERT_ROWS",
                body={"values": detail_rows},
            ).execute()

        # Write to 統計 tab (summary)
        service.spreadsheets().values().append(
            spreadsheetId=sheet_id,
            range="統計!A:I",
            valueInputOption="RAW",
            insertDataOption="INSERT_ROWS",
            body={"values": [summary_row]},
        ).execute()

        return {
            "success": True,
            "message": f"已提交 {len(submission.items)} 個檢核點（{pass_count} Pass / {fail_count} Fail / {skip_count} Skip）",
            "summary": {
                "tester": submission.tester_name,
                "date": test_date,
                "total": len(submission.items),
                "pass": pass_count,
                "fail": fail_count,
                "skip": skip_count,
            },
        }

    except Exception as e:
        error_msg = str(e)
        # Check if it's a "sheet not found" error
        if "Unable to parse range" in error_msg:
            raise HTTPException(
                status_code=500,
                detail="Sheet tabs not found. Please create '測試' and '統計' tabs in the Google Sheet.",
            )
        raise HTTPException(status_code=500, detail=f"Failed to write to sheet: {error_msg}")


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
