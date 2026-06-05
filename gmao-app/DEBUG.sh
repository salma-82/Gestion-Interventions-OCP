#!/bin/bash

# Test backend connectivity
echo "=== TESTING BACKEND API ==="
echo ""

# Check if backend is running
echo "1. Backend Health Check:"
curl -s http://localhost:8080/api/auth/me 2>&1 | head -5
echo ""
echo ""

# Get sample token (you'll need to manually get this from login)
echo "2. Expected endpoints for escalation:"
echo "   PUT: /api/technicien/interventions/{id}/actions"
echo "   POST: /api/technicien/interventions/{id}/escalader"
echo ""

echo "3. Common 403 causes:"
echo "   ❌ Token missing or invalid"
echo "   ❌ User doesn't have ROLE_N1"
echo "   ❌ Backend CORS blocking"
echo "   ❌ Backend permission check failing"
echo ""

echo "4. Next step:"
echo "   Open F12 Console and check:"
echo "   - localStorage.getItem('token')"
echo "   - localStorage.getItem('user')"
