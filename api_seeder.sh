#!/bin/bash

# --- BASE CONFIG ---
BASE_URL="http://localhost:3000"
CONTENT_TYPE="Content-Type: application/json"

# --- 1. Seed Permissions ---
echo "Seeding permissions..."
curl -s -X POST $BASE_URL/permissions -H "$CONTENT_TYPE" -d '{"entity": "Order", "action": "create", "description": "Allows creating new orders"}'
curl -s -X POST $BASE_URL/permissions -H "$CONTENT_TYPE" -d '{"entity": "Order", "action": "update", "description": "Allows updating existing orders"}'
curl -s -X POST $BASE_URL/permissions -H "$CONTENT_TYPE" -d '{"entity": "Commodity", "action": "view", "description": "Permission to view commodity data"}'
curl -s -X POST $BASE_URL/permissions -H "$CONTENT_TYPE" -d '{"entity": "User", "action": "delete", "description": "Permission to delete user accounts"}'

# --- 2. Seed Policies (Referencing permissionKeys) ---
echo "Seeding policies..."
curl -s -X POST $BASE_URL/policies -H "$CONTENT_TYPE" -d '{
  "id": "admin-policy",
  "name": "Admin Policy",
  "description": "Full access to manage all orders",
  "rules": [
    { "permissionKey": "Order.create" },
    { "permissionKey": "Order.update" },
    { "permissionKey": "User.delete" }
  ],
  "createdAt": "2025-06-11T13:42:00.000Z",
  "updatedAt": "2025-06-11T13:42:00.000Z"
}'

curl -s -X POST $BASE_URL/policies -H "$CONTENT_TYPE" -d '{
  "id": "regional-manager-policy",
  "name": "Regional Manager Policy",
  "description": "Can manage orders within their region",
  "rules": [
    {
      "permissionKey": "Order.update",
      "conditions": { "region": "${user.region}" }
    }
  ],
  "createdAt": "2025-06-11T13:45:00.000Z",
  "updatedAt": "2025-06-11T13:45:00.000Z"
}'

curl -s -X POST $BASE_URL/policies -H "$CONTENT_TYPE" -d '{
  "id": "restricted-policy",
  "name": "Restricted Policy",
  "description": "Cannot delete users",
  "rules": [
    {
      "permissionKey": "User.delete",
      "inverted": true,
      "reason": "You are not allowed to delete users"
    }
  ],
  "createdAt": "2025-06-11T13:50:00.000Z",
  "updatedAt": "2025-06-11T13:50:00.000Z"
}'

curl -s -X POST $BASE_URL/policies -H "$CONTENT_TYPE" -d '{
  "id": "multi-state-ops",
  "name": "Operation State Policy",
  "description": "Allows updates in multiple operation states",
  "rules": [
    {
      "permissionKey": "Order.update",
      "conditions": { "region": "${user.region}" }
    }
  ],
  "createdAt": "2025-06-11T13:55:00.000Z",
  "updatedAt": "2025-06-11T13:55:00.000Z"
}'

# --- 3. Seed Roles ---
echo "Seeding roles..."
curl -s -X POST $BASE_URL/roles -H "$CONTENT_TYPE" -d '{ "name": "admin" }'
curl -s -X POST $BASE_URL/roles -H "$CONTENT_TYPE" -d '{ "name": "regional_manager" }'
curl -s -X POST $BASE_URL/roles -H "$CONTENT_TYPE" -d '{ "name": "auditor" }'
curl -s -X POST $BASE_URL/roles -H "$CONTENT_TYPE" -d '{ "name": "ops_manager" }'

# --- 4. Attach Policies to Roles ---
echo "Attaching policies to roles..."
curl -s -X POST $BASE_URL/role-policies -H "$CONTENT_TYPE" -d '{ "roleId": 1, "policyId": "admin-policy" }'
curl -s -X POST $BASE_URL/role-policies -H "$CONTENT_TYPE" -d '{ "roleId": 2, "policyId": "regional-manager-policy" }'
curl -s -X POST $BASE_URL/role-policies -H "$CONTENT_TYPE" -d '{ "roleId": 3, "policyId": "restricted-policy" }'
curl -s -X POST $BASE_URL/role-policies -H "$CONTENT_TYPE" -d '{ "roleId": 4, "policyId": "multi-state-ops" }'
curl -s -X POST $BASE_URL/role-policies -H "$CONTENT_TYPE" -d '{ "roleId": 4, "policyId": "restricted-policy" }'

# --- 5. Seed Users ---
echo "Seeding users..."
curl -s -X POST $BASE_URL/auth/register -H "$CONTENT_TYPE" -d '{"username": "admin_user", "password": "password123", "roleId": 1}'
curl -s -X POST $BASE_URL/auth/register -H "$CONTENT_TYPE" -d '{"username": "regional_mgr", "password": "password123", "roleId": 2}'
curl -s -X POST $BASE_URL/auth/register -H "$CONTENT_TYPE" -d '{"username": "auditor_user", "password": "password123", "roleId": 3}'
curl -s -X POST $BASE_URL/auth/register -H "$CONTENT_TYPE" -d '{"username": "ops_manager_user", "password": "password123", "roleId": 4}'

# --- 6. Assign Attributes to Users ---
echo "Assigning user attributes..."
curl -s -X POST $BASE_URL/auth/1/attributes -H "$CONTENT_TYPE" -d '{"region": "PanIndia", "department": "Administration"}'
curl -s -X POST $BASE_URL/auth/2/attributes -H "$CONTENT_TYPE" -d '{"region": "Rajasthan", "department": "Sales"}'
curl -s -X POST $BASE_URL/auth/3/attributes -H "$CONTENT_TYPE" -d '{"region": "Uttar Pradesh", "department": "Audit"}'
curl -s -X POST $BASE_URL/auth/4/attributes -H "$CONTENT_TYPE" -d '{"region": "Madhya Pradesh", "department": "Operations"}'

# --- 7. Create Resources for Reference UI ---
echo "Creating resource metadata..."
curl -s -X POST $BASE_URL/resources -H "$CONTENT_TYPE" -d '{"name": "Order", "description": "Handles customer and seller orders"}'
curl -s -X POST $BASE_URL/resources -H "$CONTENT_TYPE" -d '{"name": "User", "description": "Manages platform users"}'
curl -s -X POST $BASE_URL/resources -H "$CONTENT_TYPE" -d '{"name": "Commodity", "description": "Catalog of agricultural commodities"}'

echo "✅ Seeding completed."
