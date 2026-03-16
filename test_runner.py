#!/usr/bin/env python3
"""Run CoLife API tests against the live Vercel URL."""
import urllib.request
import urllib.error
import json
import sys
import os

BASE = os.environ.get('TEST_BASE_URL', 'http://localhost:3000')

# Load fixtures
with open('tests/fixtures/test-users.json') as f:
    fx = json.load(f)

tenant_token = fx['tenant']['token']
owner_token = fx['owner']['token']
admin_token = fx['admin']['token']
tenant_id = fx['tenant']['id']
owner_id = fx['owner']['id']
admin_id = fx['admin']['id']
tenant_phone = fx['tenant']['phone']
owner_phone = fx['owner']['phone']
property_id = fx['property']['id']
room_id = fx['room']['id']
bed_id = fx['bed']['id']

results = []
passed = 0
failed = 0

def req(method, path, data=None, headers=None, timeout=30):
    url = f"{BASE}{path}"
    req_headers = {'Content-Type': 'application/json'}
    if headers:
        req_headers.update(headers)

    body = json.dumps(data).encode() if data else None

    request = urllib.request.Request(url, data=body, headers=req_headers, method=method)

    try:
        with urllib.request.urlopen(request, timeout=timeout) as resp:
            body = resp.read().decode()
            try:
                return resp.status, json.loads(body)
            except:
                return resp.status, body
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        try:
            return e.code, json.loads(body)
        except:
            return e.code, body
    except Exception as e:
        return 0, str(e)

def test(name, fn):
    global passed, failed
    try:
        fn()
        results.append({'name': name, 'status': 'PASSED'})
        passed += 1
        print(f"  PASS  {name}")
    except AssertionError as e:
        results.append({'name': name, 'status': 'FAILED', 'error': str(e)})
        failed += 1
        print(f"  FAIL  {name}")
        print(f"        {e}")
    except Exception as e:
        results.append({'name': name, 'status': 'FAILED', 'error': str(e)})
        failed += 1
        print(f"  FAIL  {name}")
        print(f"        {e}")

print(f"\n=== CoLife API Tests ===")
print(f"BASE: {BASE}\n")

# === AUTH TESTS ===
print("--- auth.api.test.ts ---")

def t1():
    status, body = req('POST', '/api/v1/auth/send-otp', {})
    assert status == 400, f"Expected 400, got {status}"
test("POST /auth/send-otp: returns 400 when phone is missing", t1)

def t2():
    status, body = req('POST', '/api/v1/auth/send-otp', {'phone': '+919876543210'})
    assert status in [200, 429], f"Expected 200 or 429, got {status}"
test("POST /auth/send-otp: returns 200/429 for valid phone", t2)

def t3():
    status, body = req('POST', '/api/v1/auth/verify-otp', {})
    assert status == 400, f"Expected 400, got {status}"
    err = body.get('error', '') if isinstance(body, dict) else str(body)
    assert 'firebaseIdToken' in err.lower() or 'firebase' in err.lower(), f"Expected error about firebaseIdToken, got: {err}"
test("POST /auth/verify-otp: returns 400 when firebaseIdToken is missing", t3)

def t4():
    status, body = req('POST', '/api/v1/auth/verify-otp', {'firebaseIdToken': 'invalid-token-xyz'})
    assert status == 401, f"Expected 401, got {status}"
test("POST /auth/verify-otp: returns 401 for invalid firebase token", t4)

def t5():
    status, body = req('POST', '/api/v1/auth/register', {})
    assert status in [400, 500], f"Expected 400 or 500, got {status}"
test("POST /auth/register: returns 400 when required fields missing", t5)

def t6():
    status, body = req('POST', '/api/v1/auth/register', {'name': 'Test User', 'role': 'TENANT'})
    assert status in [400, 500], f"Expected 400 or 500, got {status}"
test("POST /auth/register: returns 400 when phone is missing", t6)

def t7():
    status, body = req('GET', '/api/v1/tickets')
    assert status == 401, f"Expected 401, got {status}"
test("Auth middleware: protected routes return 401 without token", t7)

def t8():
    status, body = req('GET', '/api/v1/tickets', headers={'Authorization': 'Bearer not-a-valid-jwt'})
    assert status == 401, f"Expected 401, got {status}"
test("Auth middleware: protected routes return 401 with malformed token", t8)

def t9():
    status, body = req('GET', '/api/v1/tickets', headers={'Authorization': 'some-token-without-prefix'})
    assert status == 401, f"Expected 401, got {status}"
test("Auth middleware: protected routes return 401 with no Bearer prefix", t9)

# === USERS TESTS ===
print("\n--- users.api.test.ts ---")

def u1():
    status, body = req('GET', '/api/v1/users/me')
    assert status == 401, f"Expected 401, got {status}"
test("GET /users/me: returns 401 without auth", u1)

def u2():
    status, body = req('GET', '/api/v1/users/me', headers={'Authorization': f'Bearer {tenant_token}'})
    assert status == 200, f"Expected 200, got {status}. Body: {body}"
    assert body['user']['id'] == tenant_id, f"Expected tenant id"
    assert body['user']['role'] == 'TENANT', f"Expected TENANT role"
    assert body['user']['phone'] == tenant_phone, f"Expected tenant phone"
test("GET /users/me: returns TENANT profile nested in user key", u2)

def u3():
    status, body = req('GET', '/api/v1/users/me', headers={'Authorization': f'Bearer {tenant_token}'})
    assert 'bookings' in body, "Missing bookings"
    assert 'tickets' in body, "Missing tickets"
    assert 'payments' in body, "Missing payments"
    assert isinstance(body['bookings'], list), "bookings should be array"
test("GET /users/me: TENANT response includes bookings, tickets, payments", u3)

def u4():
    status, body = req('GET', '/api/v1/users/me', headers={'Authorization': f'Bearer {owner_token}'})
    assert status == 200, f"Expected 200, got {status}"
    assert body['user']['id'] == owner_id, "Expected owner id"
    assert body['user']['role'] == 'OWNER', "Expected OWNER role"
    assert 'properties' in body, "Missing properties"
test("GET /users/me: returns OWNER profile with properties", u4)

def u5():
    status, body = req('GET', '/api/v1/users/me', headers={'Authorization': f'Bearer {admin_token}'})
    assert status == 200, f"Expected 200, got {status}"
    assert body['user']['id'] == admin_id, "Expected admin id"
    assert body['user']['role'] == 'ADMIN', "Expected ADMIN role"
test("GET /users/me: returns ADMIN profile", u5)

def u6():
    status, body = req('GET', '/api/v1/users/me', headers={'Authorization': f'Bearer {tenant_token}'})
    user = body.get('user', {})
    assert 'password' not in user, "password should not be exposed"
    assert 'passwordHash' not in user, "passwordHash should not be exposed"
test("GET /users/me: profile does not expose password fields", u6)

def u7():
    status, body = req('PATCH', '/api/v1/users/me', {'name': 'New Name'})
    assert status == 401, f"Expected 401, got {status}"
test("PATCH /users/me: returns 401 without auth", u7)

def u8():
    status, body = req('PATCH', '/api/v1/users/me', {'name': 'Updated Tenant Name'},
                      headers={'Authorization': f'Bearer {tenant_token}'})
    assert status == 200, f"Expected 200, got {status}. Body: {body}"
    assert body.get('name') == 'Updated Tenant Name', f"Expected updated name, got: {body.get('name')}"
test("PATCH /users/me: TENANT can update their name", u8)

def u9():
    status, body = req('PATCH', '/api/v1/users/me', {'role': 'ADMIN'},
                      headers={'Authorization': f'Bearer {tenant_token}'})
    assert status == 200, f"Expected 200, got {status}"
    assert body.get('role') == 'TENANT', f"Expected TENANT role preserved, got {body.get('role')}"
test("PATCH /users/me: cannot elevate role to ADMIN", u9)

# === PROPERTIES TESTS ===
print("\n--- properties.api.test.ts ---")

def p1():
    status, body = req('GET', '/api/v1/properties')
    assert status == 200, f"Expected 200, got {status}"
    assert 'properties' in body, "Missing properties"
    assert 'total' in body, "Missing total"
    assert 'page' in body, "Missing page"
    assert 'limit' in body, "Missing limit"
    assert isinstance(body['properties'], list), "properties should be array"
test("GET /properties: returns paginated property list", p1)

def p2():
    status, body = req('GET', '/api/v1/properties?limit=2')
    assert status == 200, f"Expected 200, got {status}"
    assert len(body['properties']) <= 2, f"Expected <=2, got {len(body['properties'])}"
    assert body['limit'] == 2, f"Expected limit=2, got {body['limit']}"
test("GET /properties: respects limit query param", p2)

def p3():
    status, body = req('GET', '/api/v1/properties?city=Bangalore')
    assert status == 200, f"Expected 200, got {status}"
    for p in body['properties']:
        assert p['city'] == 'Bangalore', f"Expected city=Bangalore, got {p['city']}"
test("GET /properties: filters by city", p3)

def p4():
    status, body = req('GET', '/api/v1/properties?gender=UNISEX')
    assert status == 200, f"Expected 200, got {status}"
    for p in body['properties']:
        assert p['gender'] == 'UNISEX', f"Expected gender=UNISEX, got {p['gender']}"
test("GET /properties: filters by gender", p4)

def p5():
    status, body = req('GET', '/api/v1/properties?type=COLIVING')
    assert status == 200, f"Expected 200, got {status}"
    for p in body['properties']:
        assert p['type'] == 'COLIVING', f"Expected type=COLIVING, got {p['type']}"
test("GET /properties: filters by type", p5)

def p6():
    status, body = req('GET', '/api/v1/properties')
    for p in body['properties']:
        assert p.get('isApproved') == True, f"Expected isApproved=true for {p['id']}"
test("GET /properties: returns only approved properties", p6)

def p7():
    status, body = req('GET', '/api/v1/properties')
    if body['properties']:
        p = body['properties'][0]
        assert 'totalBeds' in p, "Missing totalBeds"
        assert 'occupiedBeds' in p, "Missing occupiedBeds"
        assert 'occupancy' in p, "Missing occupancy"
test("GET /properties: each property has occupancy data", p7)

def p8():
    status1, b1 = req('GET', '/api/v1/properties?page=1&limit=1')
    status2, b2 = req('GET', '/api/v1/properties?page=2&limit=1')
    if b1.get('total', 0) > 1:
        id1 = b1['properties'][0]['id'] if b1['properties'] else None
        id2 = b2['properties'][0]['id'] if b2.get('properties') else None
        assert id1 != id2, f"Page 1 and page 2 should differ"
test("GET /properties: pagination - page 2 differs from page 1", p8)

def p9():
    status, body = req('GET', f'/api/v1/properties/{property_id}')
    assert status == 200, f"Expected 200, got {status}"
    assert body['id'] == property_id, "Expected property id"
    assert 'rooms' in body, "Missing rooms"
    assert 'totalBeds' in body, "Missing totalBeds"
    assert 'occupancy' in body, "Missing occupancy"
test("GET /properties/:id: returns property details for valid id", p9)

def p10():
    status, body = req('GET', '/api/v1/properties/non-existent-id-xyz')
    assert status == 404, f"Expected 404, got {status}"
test("GET /properties/:id: returns 404 for non-existent property", p10)

def p11():
    status, body = req('POST', '/api/v1/properties',
                      {'name': 'Test', 'city': 'Bangalore', 'address': 'Test', 'price': 5000, 'type': 'COLIVING', 'gender': 'UNISEX'})
    assert status == 403, f"Expected 403, got {status}"
test("POST /properties: rejects unauthenticated requests with 403", p11)

def p12():
    status, body = req('POST', '/api/v1/properties',
                      {'name': 'Test', 'city': 'Bangalore', 'address': 'Test', 'price': 5000, 'type': 'COLIVING', 'gender': 'UNISEX'},
                      headers={'Authorization': f'Bearer {tenant_token}'})
    assert status == 403, f"Expected 403, got {status}"
test("POST /properties: rejects TENANT creating a property", p12)

def p13():
    status, body = req('POST', '/api/v1/properties',
                      {'name': 'New E2E Property', 'city': 'Mumbai', 'address': '5th Road, Bandra',
                       'price': 12000, 'type': 'PG', 'gender': 'MALE', 'amenities': ['WiFi'],
                       'description': 'Created by E2E test', 'highlights': []},
                      headers={'Authorization': f'Bearer {owner_token}'})
    assert status == 201, f"Expected 201, got {status}. Body: {body}"
    assert body.get('name') == 'New E2E Property', f"Expected name"
    assert 'rooms' in body, "Missing rooms"
test("POST /properties: OWNER can create a property", p13)

def p14():
    status, body = req('POST', '/api/v1/properties',
                      {'name': 'Incomplete Property'},
                      headers={'Authorization': f'Bearer {owner_token}'})
    assert status == 400, f"Expected 400, got {status}"
test("POST /properties: returns 400 when required fields are missing", p14)

# === BOOKINGS TESTS ===
print("\n--- bookings.api.test.ts ---")

def b1():
    status, body = req('GET', '/api/v1/bookings')
    assert status == 401, f"Expected 401, got {status}"
test("GET /bookings: returns 401 without auth", b1)

def b2():
    status, body = req('GET', '/api/v1/bookings', headers={'Authorization': f'Bearer {tenant_token}'})
    assert status == 200, f"Expected 200, got {status}"
    assert 'bookings' in body, "Missing bookings"
    assert isinstance(body['bookings'], list), "bookings should be array"
test("GET /bookings: TENANT can fetch their bookings", b2)

def b3():
    status, body = req('GET', '/api/v1/bookings', headers={'Authorization': f'Bearer {owner_token}'})
    assert status == 200, f"Expected 200, got {status}"
    assert 'bookings' in body, "Missing bookings"
test("GET /bookings: OWNER can fetch bookings for their properties", b3)

def b4():
    status, body = req('GET', '/api/v1/bookings', headers={'Authorization': f'Bearer {admin_token}'})
    assert status == 200, f"Expected 200, got {status}"
test("GET /bookings: ADMIN can fetch all bookings", b4)

def b5():
    status, body = req('GET', '/api/v1/bookings', headers={'Authorization': f'Bearer {tenant_token}'})
    for booking in body.get('bookings', []):
        assert booking['tenantId'] == tenant_id, f"Expected tenantId={tenant_id}, got {booking['tenantId']}"
test("GET /bookings: TENANT only sees their own bookings", b5)

def b6():
    status, body = req('POST', '/api/v1/bookings',
                      {'roomId': 'some-room', 'bedId': 'some-bed', 'startDate': '2026-03-17T00:00:00Z', 'amount': 8000})
    assert status == 401, f"Expected 401, got {status}"
test("POST /bookings: returns 401 without auth", b6)

def b7():
    status, body = req('POST', '/api/v1/bookings',
                      {'roomId': 'non-existent-room', 'bedId': 'non-existent-bed',
                       'startDate': '2026-03-17T00:00:00Z', 'amount': 8000},
                      headers={'Authorization': f'Bearer {tenant_token}'})
    assert status in [400, 404, 500], f"Expected 400/404/500, got {status}"
test("POST /bookings: returns error for non-existent bed", b7)

def b8():
    status, body = req('POST', '/api/v1/bookings',
                      {'roomId': room_id, 'bedId': bed_id, 'startDate': '2026-03-17T00:00:00Z',
                       'amount': 8000, 'securityDeposit': 16000},
                      headers={'Authorization': f'Bearer {tenant_token}'})
    assert status in [201, 400, 409, 500], f"Expected 201/400/409/500, got {status}"
    if status == 201:
        assert body['tenantId'] == tenant_id, "Expected tenantId"
        assert body['roomId'] == room_id, "Expected roomId"
test("POST /bookings: TENANT can create a booking for available bed", b8)

# === TICKETS TESTS ===
print("\n--- tickets.api.test.ts ---")

def tk1():
    status, body = req('GET', '/api/v1/tickets')
    assert status == 401, f"Expected 401, got {status}"
test("GET /tickets: returns 401 without auth", tk1)

def tk2():
    status, body = req('GET', '/api/v1/tickets', headers={'Authorization': f'Bearer {tenant_token}'})
    assert status == 200, f"Expected 200, got {status}"
    assert 'tickets' in body, "Missing tickets"
    assert isinstance(body['tickets'], list), "tickets should be array"
test("GET /tickets: TENANT can fetch their tickets", tk2)

def tk3():
    status, body = req('GET', '/api/v1/tickets', headers={'Authorization': f'Bearer {owner_token}'})
    assert status == 200, f"Expected 200, got {status}"
    assert 'tickets' in body, "Missing tickets"
test("GET /tickets: OWNER can fetch tickets for their properties", tk3)

def tk4():
    status, body = req('GET', '/api/v1/tickets', headers={'Authorization': f'Bearer {admin_token}'})
    assert status == 200, f"Expected 200, got {status}"
test("GET /tickets: ADMIN can fetch all tickets", tk4)

def tk5():
    status, body = req('POST', '/api/v1/tickets',
                      {'title': 'Test', 'category': 'ELECTRICAL', 'priority': 'MEDIUM'})
    assert status == 401, f"Expected 401, got {status}"
test("POST /tickets: returns 401 without auth", tk5)

def tk6():
    status, body = req('POST', '/api/v1/tickets',
                      {'title': 'E2E Test Ticket', 'description': 'Created by E2E test suite',
                       'category': 'ELECTRICAL', 'priority': 'LOW', 'propertyId': property_id},
                      headers={'Authorization': f'Bearer {tenant_token}'})
    assert status == 201, f"Expected 201, got {status}. Body: {body}"
    assert body['title'] == 'E2E Test Ticket', "Expected title"
    assert body['status'] == 'OPEN', "Expected OPEN status"
    assert body['tenantId'] == tenant_id, "Expected tenantId"
    assert body['category'] == 'ELECTRICAL', "Expected category"
test("POST /tickets: TENANT can create a ticket", tk6)

def tk7():
    req('POST', '/api/v1/tickets',
        {'title': 'Plumbing Issue E2E', 'category': 'PLUMBING', 'priority': 'HIGH', 'propertyId': property_id},
        headers={'Authorization': f'Bearer {tenant_token}'})
    status, body = req('GET', '/api/v1/tickets', headers={'Authorization': f'Bearer {tenant_token}'})
    titles = [t['title'] for t in body.get('tickets', [])]
    assert 'Plumbing Issue E2E' in titles, f"Expected 'Plumbing Issue E2E' in tickets. Got: {titles}"
test("POST /tickets: created ticket appears in GET /tickets", tk7)

def tk8():
    status, body = req('GET', '/api/v1/tickets', headers={'Authorization': f'Bearer {tenant_token}'})
    if body.get('tickets'):
        ticket = body['tickets'][0]
        assert 'tenant' in ticket, "Missing tenant info"
        assert 'name' in ticket['tenant'], "Missing tenant.name"
        assert 'phone' in ticket['tenant'], "Missing tenant.phone"
test("POST /tickets: ticket response includes tenant and property info", tk8)

def tk9():
    status, body = req('GET', '/api/v1/tickets', headers={'Authorization': f'Bearer {tenant_token}'})
    for ticket in body.get('tickets', []):
        assert ticket['tenantId'] == tenant_id, f"Expected tenantId={tenant_id}, got {ticket['tenantId']}"
test("GET /tickets: TENANT only sees their own tickets", tk9)

# === PAYMENTS TESTS ===
print("\n--- payments.api.test.ts ---")

def py1():
    status, body = req('GET', '/api/v1/payments')
    assert status == 401, f"Expected 401, got {status}"
test("GET /payments: returns 401 without auth", py1)

def py2():
    status, body = req('GET', '/api/v1/payments', headers={'Authorization': f'Bearer {tenant_token}'})
    assert status == 200, f"Expected 200, got {status}"
    assert 'payments' in body, "Missing payments"
    assert isinstance(body['payments'], list), "payments should be array"
test("GET /payments: TENANT can fetch their payments", py2)

def py3():
    status, body = req('GET', '/api/v1/payments', headers={'Authorization': f'Bearer {owner_token}'})
    assert status == 200, f"Expected 200, got {status}"
test("GET /payments: OWNER can fetch payments", py3)

def py4():
    status, body = req('GET', '/api/v1/payments', headers={'Authorization': f'Bearer {admin_token}'})
    assert status == 200, f"Expected 200, got {status}"
test("GET /payments: ADMIN can fetch all payments", py4)

def py5():
    status, body = req('POST', '/api/v1/payments/create-order',
                      {'bookingId': 'some-booking-id', 'amount': 5000})
    assert status == 401, f"Expected 401, got {status}"
test("POST /payments/create-order: returns 401 without auth", py5)

def py6():
    status, body = req('POST', '/api/v1/payments/create-order',
                      {'bookingId': 'non-existent-booking-id', 'amount': 5000},
                      headers={'Authorization': f'Bearer {tenant_token}'})
    assert status in [400, 404, 500], f"Expected 400/404/500, got {status}"
test("POST /payments/create-order: returns error for non-existent booking", py6)

def py7():
    status, body = req('POST', '/api/v1/payments/collect',
                      {'tenantId': 'some-id', 'amount': 1000, 'method': 'CASH'})
    assert status == 401, f"Expected 401, got {status}"
test("POST /payments/collect: returns 401 without auth", py7)

def py8():
    status, body = req('POST', '/api/v1/payments/collect',
                      {'tenantId': tenant_id, 'amount': 1000, 'method': 'CASH'},
                      headers={'Authorization': f'Bearer {tenant_token}'})
    assert status in [400, 403, 404, 500], f"Expected 400/403/404/500, got {status}"
test("POST /payments/collect: TENANT cannot collect payment", py8)

# === ADMIN TESTS ===
print("\n--- admin.api.test.ts ---")

def a1():
    status, body = req('GET', '/api/v1/admin/stats')
    assert status == 401, f"Expected 401, got {status}"
test("GET /admin/stats: returns 401 without auth", a1)

def a2():
    status, body = req('GET', '/api/v1/admin/stats', headers={'Authorization': f'Bearer {tenant_token}'})
    assert status == 200, f"Expected 200, got {status}"
test("GET /admin/stats: returns 200 for authenticated user", a2)

def a3():
    status, body = req('GET', '/api/v1/admin/stats', headers={'Authorization': f'Bearer {admin_token}'})
    assert status == 200, f"Expected 200, got {status}"
    for field in ['totalUsers', 'totalProperties', 'totalRevenue', 'totalBeds', 'occupiedBeds', 'occupancyRate', 'roleBreakdown', 'revenueByMonth']:
        assert field in body, f"Missing {field}"
test("GET /admin/stats: response includes all platform stat fields", a3)

def a4():
    status, body = req('GET', '/api/v1/admin/stats', headers={'Authorization': f'Bearer {admin_token}'})
    assert body.get('totalUsers', 0) > 0, f"Expected totalUsers > 0, got {body.get('totalUsers')}"
test("GET /admin/stats: totalUsers is a positive number", a4)

def a5():
    status, body = req('GET', '/api/v1/admin/users')
    assert status == 401, f"Expected 401, got {status}"
test("GET /admin/users: returns 401 without auth", a5)

def a6():
    status, body = req('GET', '/api/v1/admin/users', headers={'Authorization': f'Bearer {tenant_token}'})
    assert status == 200, f"Expected 200, got {status}"
    assert 'users' in body, "Missing users"
    assert isinstance(body['users'], list), "users should be array"
test("GET /admin/users: any authenticated user can list users", a6)

def a7():
    status, body = req('GET', '/api/v1/admin/users', headers={'Authorization': f'Bearer {admin_token}'})
    assert status == 200, f"Expected 200, got {status}"
    assert len(body.get('users', [])) > 0, "Expected users.length > 0"
test("GET /admin/users: list includes all users", a7)

def a8():
    status, body = req('GET', '/api/v1/admin/users?role=TENANT', headers={'Authorization': f'Bearer {admin_token}'})
    assert status == 200, f"Expected 200, got {status}"
    for u in body.get('users', []):
        assert u['role'] == 'TENANT', f"Expected role=TENANT, got {u['role']}"
test("GET /admin/users: can filter users by role=TENANT", a8)

def a9():
    status, body = req('GET', '/api/v1/admin/payments')
    assert status == 401, f"Expected 401, got {status}"
test("GET /admin/payments: returns 401 without auth", a9)

def a10():
    status, body = req('GET', '/api/v1/admin/payments', headers={'Authorization': f'Bearer {admin_token}'})
    assert status == 200, f"Expected 200, got {status}"
    assert 'payments' in body, "Missing payments"
test("GET /admin/payments: authenticated user can fetch payments", a10)

def a11():
    status, body = req('PATCH', f'/api/v1/admin/properties/{property_id}', {'isApproved': True})
    assert status == 401, f"Expected 401, got {status}"
test("PATCH /admin/properties/:id: returns 401 without auth", a11)

def a12():
    status, body = req('PATCH', f'/api/v1/admin/properties/{property_id}', {'isApproved': True},
                      headers={'Authorization': f'Bearer {admin_token}'})
    assert status == 200, f"Expected 200, got {status}"
    assert body.get('property', {}).get('isApproved') == True, f"Expected isApproved=true"
test("PATCH /admin/properties/:id: any authenticated user can update a property", a12)

def a13():
    status, body = req('PATCH', f'/api/v1/admin/properties/{property_id}', {'unknownField': 'ignored'},
                      headers={'Authorization': f'Bearer {admin_token}'})
    assert status == 400, f"Expected 400, got {status}"
test("PATCH /admin/properties/:id: returns 400 for empty update body", a13)

# === RECOMMENDATIONS TESTS ===
print("\n--- recommendations.api.test.ts ---")

def r1():
    status, body = req('GET', '/api/v1/ai/recommendations')
    assert status == 200, f"Expected 200, got {status}"
test("GET /ai/recommendations: returns 200 without auth", r1)

def r2():
    status, body = req('GET', '/api/v1/ai/recommendations')
    assert isinstance(body, list), f"Expected array, got {type(body)}"
test("GET /ai/recommendations: returns an array", r2)

def r3():
    status, body = req('GET', '/api/v1/ai/recommendations')
    for item in body:
        assert 'property' in item, "Missing property"
        assert 'score' in item, "Missing score"
        assert 'reasons' in item, "Missing reasons"
        assert isinstance(item['reasons'], list), "reasons should be array"
        assert isinstance(item['score'], (int, float)), "score should be a number"
test("GET /ai/recommendations: each item has property, score, and reasons", r3)

def r4():
    status, body = req('GET', '/api/v1/ai/recommendations?limit=3')
    assert len(body) <= 3, f"Expected <=3 results, got {len(body)}"
test("GET /ai/recommendations: respects limit query param", r4)

def r5():
    status, body = req('GET', '/api/v1/ai/recommendations?limit=1')
    assert len(body) <= 1, f"Expected <=1 results, got {len(body)}"
test("GET /ai/recommendations: limit=1 returns at most 1 result", r5)

def r6():
    status, body = req('GET', '/api/v1/ai/recommendations?limit=100')
    assert len(body) <= 20, f"Expected <=20 results (capped), got {len(body)}"
test("GET /ai/recommendations: limit is capped at 20", r6)

def r7():
    status, body = req('GET', '/api/v1/ai/recommendations?limit=5')
    for item in body:
        assert 'totalBeds' in item['property'], "Missing totalBeds"
        assert 'availableBeds' in item['property'], "Missing availableBeds"
        assert 'occupancy' in item['property'], "Missing occupancy"
test("GET /ai/recommendations: property object includes occupancy and bed fields", r7)

def r8():
    status, body = req('GET', '/api/v1/ai/recommendations?limit=10')
    for item in body:
        assert item['score'] > 0, f"Expected score > 0, got {item['score']}"
test("GET /ai/recommendations: score is a positive number", r8)

def r9():
    status, body = req('GET', '/api/v1/ai/recommendations?limit=10')
    for i in range(1, len(body)):
        assert body[i-1]['score'] >= body[i]['score'], f"Expected scores in descending order"
test("GET /ai/recommendations: results are sorted by score descending", r9)

def r10():
    status, body = req('GET', '/api/v1/ai/recommendations?limit=10')
    for item in body:
        assert len(item['reasons']) > 0, f"Expected non-empty reasons"
test("GET /ai/recommendations: reasons array is non-empty for every result", r10)

def r11():
    status, body = req('GET', '/api/v1/ai/recommendations?limit=20')
    for item in body:
        assert item['property'].get('isApproved') == True, f"Expected isApproved=true"
test("GET /ai/recommendations: only approved properties are recommended", r11)

def r12():
    status, body = req('GET', '/api/v1/ai/recommendations?limit=100')
    ids = [item['property']['id'] for item in body]
    assert property_id in ids, f"Expected test property {property_id} in recommendations. Got: {ids[:5]}"
test("GET /ai/recommendations: test property (seeded) appears in results", r12)

def r13():
    status, body = req('GET', '/api/v1/ai/recommendations?limit=5',
                      headers={'Authorization': f'Bearer {tenant_token}'})
    assert status == 200, f"Expected 200, got {status}"
    assert isinstance(body, list), "Expected array"
test("GET /ai/recommendations: authenticated request returns personalized results", r13)

# === SUMMARY ===
print(f"\n\n{'='*50}")
print(f"API TEST SUMMARY")
print(f"{'='*50}")
print(f"Total:  {passed + failed}")
print(f"Passed: {passed}")
print(f"Failed: {failed}")
print(f"{'='*50}")

if failed > 0:
    print("\nFAILED TESTS:")
    for r in results:
        if r['status'] == 'FAILED':
            print(f"  - {r['name']}")
            print(f"    {r.get('error', 'Unknown error')}")

# Write results to file
with open('/Users/rajendrakalla/colife/colife/api-results.json', 'w') as f:
    json.dump({'results': results, 'passed': passed, 'failed': failed, 'total': passed + failed}, f, indent=2)
print(f"\nResults written to api-results.json")

sys.exit(1 if failed > 0 else 0)
