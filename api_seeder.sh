curl -X POST http://localhost:3000/permissions \
  -H "Content-Type: application/json" \
  -d '{
    "entity": "Order",
    "action": "create",
    "description": "Allows creating new orders"
  }'

curl -X POST http://localhost:3000/permissions \
  -H "Content-Type: application/json" \
  -d '{
    "entity": "Order",
    "action": "update",
    "description": "Allows updating existing orders"
  }'

curl -X POST http://localhost:3000/permissions \
  -H "Content-Type: application/json" \
  -d '{
    "entity": "Commodity",
    "action": "view",
    "description": "Permission to view commodity data"
  }'

curl -X POST http://localhost:3000/permissions \
  -H "Content-Type: application/json" \
  -d '{
    "entity": "User",
    "action": "delete",
    "description": "Permission to delete user accounts"
  }'


# {"key":"Order.create"}{"key":"Order.update"}{"key":"Commodity.view"}{"key":"User.delete"}%  


curl -X POST http://localhost:3000/policies \
  -H "Content-Type: application/json" \
  -d '{
    "id": "admin-policy",
    "name": "Admin Policy",
    "description": "Full access to manage all orders",
    "rules": [
      { "action": "create", "subject": "Order" },
      { "action": "update", "subject": "Order" },
      { "action": "delete", "subject": "Order" }
    ],
    "createdAt": "2025-06-11T13:42:00.000Z",
    "updatedAt": "2025-06-11T13:42:00.000Z"
  }'


curl -X POST http://localhost:3000/policies \
  -H "Content-Type: application/json" \
  -d '{
    "id": "regional-manager-policy",
    "name": "Regional Manager Policy",
    "description": "Can manage orders within their region",
    "rules": [
      {
        "action": "update",
        "subject": "Order",
        "conditions": {
          "region": "${user.region}"
        }
      }
    ],
    "createdAt": "2025-06-11T13:45:00.000Z",
    "updatedAt": "2025-06-11T13:45:00.000Z"
  }'


curl -X POST http://localhost:3000/policies \
  -H "Content-Type: application/json" \
  -d '{
    "id": "restricted-policy",
    "name": "Restricted Policy",
    "description": "Cannot delete users",
    "rules": [
      {
        "action": "delete",
        "subject": "User",
        "inverted": true,
        "reason": "You are not allowed to delete users"
      }
    ],
    "createdAt": "2025-06-11T13:50:00.000Z",
    "updatedAt": "2025-06-11T13:50:00.000Z"
  }'


curl -X POST http://localhost:3000/policies \
  -H "Content-Type: application/json" \
  -d '{
    "id": "multi-state-ops",
    "name": "Operation State Policy",
    "description": "Allows updates in multiple operation states",
    "rules": [
      {
        "action": "update",
        "subject": "Order",
        "conditions": {
          "state": { "$in": "${user.operationStates}" },
          "region": "${user.region}"
        }
      }
    ],
    "createdAt": "2025-06-11T13:55:00.000Z",
    "updatedAt": "2025-06-11T13:55:00.000Z"
  }'



# {"message":"Policy created","id":"admin-policy"}{"message":"Policy created","id":"regional-manager-policy"}{"message":"Policy created","id":"restricted-policy"}{"message":"Policy created","id":"multi-state-ops"}%     




curl -X POST http://localhost:3000/roles \
  -H "Content-Type: application/json" \
  -d '{ "name": "admin" }'

curl -X POST http://localhost:3000/roles \
  -H "Content-Type: application/json" \
  -d '{ "name": "regional_manager" }'

curl -X POST http://localhost:3000/roles \
  -H "Content-Type: application/json" \
  -d '{ "name": "auditor" }'

curl -X POST http://localhost:3000/roles \
  -H "Content-Type: application/json" \
  -d '{ "name": "ops_manager" }'


# {"id":1}{"id":2}{"id":3}{"id":4}%


# Admin -> admin-policy
curl -X POST http://localhost:3000/role-policies \
  -H "Content-Type: application/json" \
  -d '{ "roleId": 1, "policyId": "admin-policy" }'

# Regional Manager -> regional-manager-policy
curl -X POST http://localhost:3000/role-policies \
  -H "Content-Type: application/json" \
  -d '{ "roleId": 2, "policyId": "regional-manager-policy" }'

# Auditor -> restricted-policy
curl -X POST http://localhost:3000/role-policies \
  -H "Content-Type: application/json" \
  -d '{ "roleId": 3, "policyId": "restricted-policy" }'

# Ops Manager -> multi-state-ops + restricted-policy
curl -X POST http://localhost:3000/role-policies \
  -H "Content-Type: application/json" \
  -d '{ "roleId": 4, "policyId": "multi-state-ops" }'

curl -X POST http://localhost:3000/role-policies \
  -H "Content-Type: application/json" \
  -d '{ "roleId": 4, "policyId": "restricted-policy" }'



# {"error":"Role-policy pair already exists or role does not exist"}zsh: command not found: #
# {"message":"Policy attached to role","id":2}zsh: command not found: #
# {"message":"Policy attached to role","id":3}zsh: command not found: #
# {"message":"Policy attached to role","id":4}{"message":"Policy attached to role","id":5}%                                                    

# 👤 Admin User

curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin_user",
    "password": "password123",
    "roleId": 1
  }'
# 👤 Regional Manager

curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "regional_mgr",
    "password": "password123",
    "roleId": 2
  }'
# 👤 Auditor

curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "auditor_user",
    "password": "password123",
    "roleId": 3
  }'
# 👤 Ops Manager

curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "ops_manager_user",
    "password": "password123",
    "roleId": 4
  }'





  curl -X POST http://localhost:3000/auth/1/attributes \
  -H "Content-Type: application/json" \
  -d '{
    "region": "PanIndia",
    "department": "Administration"
  }'


curl -X POST http://localhost:3000/auth/2/attributes \
  -H "Content-Type: application/json" \
  -d '{
    "region": "Rajasthan",
    "department": "Sales"
  }'




curl -X POST http://localhost:3000/auth/3/attributes \
  -H "Content-Type: application/json" \
  -d '{
    "region": "Uttar Pradesh",
    "department": "Audit"
  }'

curl -X POST http://localhost:3000/auth/4/attributes \
  -H "Content-Type: application/json" \
  -d '{
    "region": "Madhya Pradesh",
    "department": "Operations"
  }'



# {"message":"Attributes saved","userId":"1","region":"PanIndia","department":"Administration"}{"message":"Attributes saved","userId":"2","region":"Rajasthan","department":"Sales"}{"message":"Attributes saved","userId":"3","region":"Uttar Pradesh","department":"Audit"}{"message":"Attributes saved","userId":"4","region":"Madhya Pradesh","department":"Operations"}%    



curl -X POST http://localhost:3000/resources \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Order",
    "description": "Handles customer and seller orders"
  }'

curl -X POST http://localhost:3000/resources \
  -H "Content-Type: application/json" \
  -d '{
    "name": "User",
    "description": "Manages platform users"
  }'

curl -X POST http://localhost:3000/resources \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Commodity",
    "description": "Catalog of agricultural commodities"
  }'
