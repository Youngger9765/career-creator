# Load Testing for Career Creator

Load testing suite for validating system capacity under concurrent user load.

## Installation

```bash
cd load-tests
pip install -r requirements.txt
```

## Test Scripts

### 1. Concurrent Rooms Test (Primary Test)

Tests N counselors each creating a room with 1 visitor (2N total users, N rooms).

**Usage:**

```bash
# Test 100 rooms on staging (default)
python test_concurrent_rooms.py

# Test 50 rooms
python test_concurrent_rooms.py --rooms 50

# Test 200 rooms on local backend
python test_concurrent_rooms.py --rooms 200 --local
```

**Output:**

- Console: Real-time progress + summary statistics
- JSON file: Detailed test results saved as `concurrent_rooms_test_{N}rooms_{env}_{timestamp}.json`

### 2. Locust Web UI Test

Interactive load testing with Locust web interface.

```bash
locust -f locustfile.py \
  --host=https://career-creator-backend-staging-x43mdhfwsq-de.a.run.app \
  --web-host=0.0.0.0
```

Then open <http://localhost:8089> to configure:

- Number of users
- Spawn rate
- Test duration

### 3. Other Test Scripts

- `test_gameplay_states.py` - Test gameplay state save/load operations
- `test_visitor_join.py` - Test concurrent visitor joins to existing rooms
- `test_concurrent_logins.py` - Simple concurrent login test

## Test Data

### Creating Test Users

Generate 100 test users for local database:

```bash
python create_test_users.py
```

This creates users:

- Emails: `test.user1@example.com` through `test.user100@example.com`
- Password: `TestPassword123!`
- Role: `counselor`

For staging, use admin dashboard to batch import users from `test_users.csv`.

## Success Criteria

✅ **Test Pass Conditions:**

1. **Response Time**: 95% requests < 1000ms
2. **Failure Rate**: < 1%
3. **Database**: No connection pool exhausted errors
4. **Cloud Run**: Auto-scaling working normally
5. **Memory**: No OOM (Out of Memory) errors

## Test Results

See [LOAD_TEST_REPORT.md](./LOAD_TEST_REPORT.md) for detailed test results and analysis.

### Latest Results (2025-11-03)

**100 Rooms Concurrent Test (Staging)**:

- 100/100 counselor logins (100%)
- 100/100 room creations (100%)
- 100/100 visitor joins (100%)
- Avg response: Login 399ms, Room 658ms, Visitor 649ms
- Total duration: 170.6s

✅ **System validated for 100+ concurrent rooms**

## Architecture Notes

### Backend Configuration

- **Pool Size**: 60 connections (30 base + 30 overflow)
- **Database**: Supabase transaction pooler (port 6543)
- **Deployment**: GCP Cloud Run with auto-scaling

### Important API Notes

⚠️ **Trailing Slash Required**: All POST endpoints require trailing slash
to avoid redirect that strips headers.

```python
# ✅ Correct
requests.post(
    f"{API_URL}/api/rooms/",
    headers={"Authorization": f"Bearer {token}"}
)

# ❌ Wrong (causes 401 error)
requests.post(
    f"{API_URL}/api/rooms",
    headers={"Authorization": f"Bearer {token}"}
)
```

## Monitoring

### During Tests

1. **Locust Dashboard**: Real-time RPS, response times, failure rates
2. **Cloud Run Metrics**: Request count, latency, instance count, CPU/memory usage
3. **Supabase Dashboard**: Active connections, query performance

### Cloud Run Monitoring

```bash
# Open Cloud Run metrics (replace URL as needed)
open "https://console.cloud.google.com/run/detail/\
asia-east1/career-creator-backend-staging/metrics\
?project=career-creator-card"
```

## Troubleshooting

### Issue: Test users not found

**Solution**: Create test users using `create_test_users.py` for local,
or batch import CSV in admin dashboard for staging.

### Issue: Connection pool exhausted

**Solution**: Reduce concurrent users or increase pool_size in `backend/app/core/database.py`.

### Issue: 401 Authorization errors

**Solution**: Ensure API URLs include trailing slash (see Architecture Notes above).

## References

- [Locust Documentation](https://docs.locust.io/)
- [Cloud Run Performance Tuning](https://cloud.google.com/run/docs/tips/general)
- [Supabase Connection Pooling](https://supabase.com/docs/guides/database/connecting-to-postgres#connection-pooler)
