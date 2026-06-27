#!/bin/bash
BASE="http://localhost:3000/api"
PASS=0
FAIL=0

check() {
  local label="$1"
  local expected="$2"
  local actual="$3"
  if echo "$actual" | grep -q "$expected"; then
    echo "  PASS: $label"
    PASS=$((PASS+1))
  else
    echo "  FAIL: $label (expected: $expected)"
    echo "       got: $(echo "$actual" | head -c 200)"
    FAIL=$((FAIL+1))
  fi
}

# Clear rate limit
redis-cli keys "login:rate:*" 2>/dev/null | xargs -I {} redis-cli del {} 2>/dev/null

echo "========================================="
echo "  Phase 4 后端测试验收"
echo "========================================="

# ===== Part 1: 认证模块 =====
echo ""
echo "--- Part 1: 认证模块 ---"

# 1.1 正常登录
echo "[1.1] 正常登录"
RES=$(curl -s -X POST "$BASE/auth/login" -H "Content-Type: application/json" -d '{"username":"admin","password":"123456"}')
TOKEN=$(echo "$RES" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['token'])" 2>/dev/null)
check "登录成功返回token" '"code":200' "$RES"

# 1.2 错误密码
echo "[1.2] 错误密码"
RES=$(curl -s -X POST "$BASE/auth/login" -H "Content-Type: application/json" -d '{"username":"admin","password":"wrong"}')
check "错误密码返回401" '"用户名或密码错误"' "$RES"

# 1.3 不存在的账号
echo "[1.3] 不存在的账号"
RES=$(curl -s -X POST "$BASE/auth/login" -H "Content-Type: application/json" -d '{"username":"nobody","password":"123456"}')
check "不存在的账号" '"用户名或密码错误"' "$RES"

# 1.4 Token验证
echo "[1.4] Token验证"
RES=$(curl -s "$BASE/auth/userinfo" -H "Authorization: Bearer $TOKEN")
check "Token验证通过" '"code":200' "$RES"

# 1.5 无Token请求
echo "[1.5] 无Token请求"
RES=$(curl -s "$BASE/auth/userinfo")
check "无Token返回401" '"未登录"' "$RES"

# 1.6 过期Token
echo "[1.6] 过期Token"
RES=$(curl -s "$BASE/auth/userinfo" -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInVzZXJuYW1lIjoiYWRtaW4iLCJyb2xlcyI6WyJhZG1pbiJdLCJpYXQiOjE3MDAwMDAwMDAsImV4cCI6MTcwMDAwMDAwMX0.xxx")
check "过期Token报错" '"message"' "$RES"

# 1.7 登出
echo "[1.7] 登出"
RES=$(curl -s -X POST "$BASE/auth/logout" -H "Authorization: Bearer $TOKEN")
check "登出成功" '"code":200' "$RES"

# ===== Part 2: 用户模块 =====
echo ""
echo "--- Part 2: 用户模块 ---"

# 重新登录
redis-cli keys "login:rate:*" 2>/dev/null | xargs -I {} redis-cli del {} 2>/dev/null
TOKEN=$(curl -s -X POST "$BASE/auth/login" -H "Content-Type: application/json" -d '{"username":"admin","password":"123456"}' | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['token'])" 2>/dev/null)

# 2.1 用户列表
echo "[2.1] 用户列表"
RES=$(curl -s "$BASE/users?page=1&size=10" -H "Authorization: Bearer $TOKEN")
check "用户列表分页" '"pagination"' "$RES"

# 2.2 用户搜索
echo "[2.2] 用户搜索"
RES=$(curl -s "$BASE/users?username=admin" -H "Authorization: Bearer $TOKEN")
check "搜索admin" '"total":1' "$RES"

# 2.3 新增用户
echo "[2.3] 新增用户"
RES=$(curl -s -X POST "$BASE/users" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"username":"testuser99","password":"123456","nickname":"测试","email":"test@test.com"}')
check "新增用户成功" '"code":200' "$RES"
NEW_ID=$(echo "$RES" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['id'])" 2>/dev/null)
echo "  新用户ID: $NEW_ID"

# 2.4 重复用户名
echo "[2.4] 重复用户名"
RES=$(curl -s -X POST "$BASE/users" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"username":"testuser99","password":"123456"}')
check "重复用户名报错" '"用户名已存在"' "$RES"

# 2.5 用户详情
echo "[2.5] 用户详情"
RES=$(curl -s "$BASE/users/$NEW_ID" -H "Authorization: Bearer $TOKEN")
check "获取用户详情" '"username":"testuser99"' "$RES"

# 2.6 编辑用户
echo "[2.6] 编辑用户"
RES=$(curl -s -X PUT "$BASE/users/$NEW_ID" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"nickname":"测试更新"}')
check "编辑用户成功" '"code":200' "$RES"

# 2.7 分配角色
echo "[2.7] 分配角色"
RES=$(curl -s -X PUT "$BASE/users/$NEW_ID/roles" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"roleIds":[2]}')
check "分配角色成功" '"code":200' "$RES"

# 2.8 重置密码
echo "[2.8] 重置密码"
RES=$(curl -s -X PUT "$BASE/users/$NEW_ID/password" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"password":"newpass123"}')
check "重置密码成功" '"code":200' "$RES"

# 2.9 删除用户
echo "[2.9] 删除用户"
RES=$(curl -s -X DELETE "$BASE/users/$NEW_ID" -H "Authorization: Bearer $TOKEN")
check "删除用户成功" '"code":200' "$RES"

# ===== Part 3: 角色模块 =====
echo ""
echo "--- Part 3: 角色模块 ---"

# 3.1 角色列表
echo "[3.1] 角色列表"
RES=$(curl -s "$BASE/roles" -H "Authorization: Bearer $TOKEN")
check "角色列表返回" '"code":200' "$RES"

# 3.2 新增角色
echo "[3.2] 新增角色"
RES=$(curl -s -X POST "$BASE/roles" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"code":"test_role99","name":"测试角色","description":"测试用"}')
check "新增角色成功" '"code":200' "$RES"
ROLE_ID=$(echo "$RES" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['id'])" 2>/dev/null)
echo "  新角色ID: $ROLE_ID"

# 3.3 重复角色编码
echo "[3.3] 重复角色编码"
RES=$(curl -s -X POST "$BASE/roles" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"code":"test_role99","name":"重复"}')
check "重复编码报错" '"角色编码已存在"' "$RES"

# 3.4 角色详情
echo "[3.4] 角色详情"
RES=$(curl -s "$BASE/roles/$ROLE_ID" -H "Authorization: Bearer $TOKEN")
check "角色详情" '"code":"test_role99"' "$RES"

# 3.5 编辑角色
echo "[3.5] 编辑角色"
RES=$(curl -s -X PUT "$BASE/roles/$ROLE_ID" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"description":"更新描述"}')
check "编辑角色成功" '"code":200' "$RES"

# 3.6 获取第一个菜单ID (用于分配测试)
echo "[3.6] 获取菜单ID"
FIRST_MENU_ID=$(curl -s "$BASE/menus" -H "Authorization: Bearer $TOKEN" | python3 -c "import sys,json; data=json.load(sys.stdin)['data']; print(data[0]['id'])" 2>/dev/null)
SECOND_MENU_ID=$(curl -s "$BASE/menus" -H "Authorization: Bearer $TOKEN" | python3 -c "import sys,json; data=json.load(sys.stdin)['data']; print(data[1]['id'])" 2>/dev/null)
echo "  菜单ID: $FIRST_MENU_ID, $SECOND_MENU_ID"

# 3.7 分配权限
echo "[3.7] 分配权限"
RES=$(curl -s -X POST "$BASE/roles/$ROLE_ID/menus" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d "{\"menuIds\":[$FIRST_MENU_ID,$SECOND_MENU_ID]}")
check "分配权限成功" '"code":200' "$RES"

# 3.8 获取角色菜单
echo "[3.8] 获取角色菜单"
RES=$(curl -s "$BASE/roles/$ROLE_ID/menus" -H "Authorization: Bearer $TOKEN")
check "获取角色菜单" '"code":200' "$RES"

# 3.9 删除角色
echo "[3.9] 删除角色"
RES=$(curl -s -X DELETE "$BASE/roles/$ROLE_ID" -H "Authorization: Bearer $TOKEN")
check "删除角色成功" '"code":200' "$RES"

# ===== Part 4: 菜单模块 =====
echo ""
echo "--- Part 4: 菜单模块 ---"

# 4.1 菜单树
echo "[4.1] 菜单树"
RES=$(curl -s "$BASE/menus/tree" -H "Authorization: Bearer $TOKEN")
check "菜单树返回" '"code":200' "$RES"

# 4.2 菜单列表
echo "[4.2] 菜单列表"
RES=$(curl -s "$BASE/menus" -H "Authorization: Bearer $TOKEN")
check "菜单列表返回" '"code":200' "$RES"

# 4.3 新增菜单
echo "[4.3] 新增菜单"
RES=$(curl -s -X POST "$BASE/menus" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"parentId":0,"path":"/newtest","name":"NewTest","type":1,"title":"新测试菜单","sort":200,"permission":"newtest:list"}')
check "新增菜单成功" '"code":200' "$RES"
NEW_MENU_ID=$(echo "$RES" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['id'])" 2>/dev/null)
echo "  新菜单ID: $NEW_MENU_ID"

# 4.4 新增子菜单
echo "[4.4] 新增子菜单"
RES=$(curl -s -X POST "$BASE/menus" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d "{\"parentId\":$NEW_MENU_ID,\"path\":\"child\",\"name\":\"Child\",\"type\":1,\"title\":\"子菜单\",\"sort\":1,\"permission\":\"child:list\"}")
check "新增子菜单成功" '"code":200' "$RES"
CHILD_ID=$(echo "$RES" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['id'])" 2>/dev/null)

# 4.5 菜单详情
echo "[4.5] 菜单详情"
RES=$(curl -s "$BASE/menus/$NEW_MENU_ID" -H "Authorization: Bearer $TOKEN")
check "菜单详情" '"name":"NewTest"' "$RES"

# 4.6 编辑菜单
echo "[4.6] 编辑菜单"
RES=$(curl -s -X PUT "$BASE/menus/$NEW_MENU_ID" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"title":"新测试菜单-更新"}')
check "编辑菜单成功" '"code":200' "$RES"

# 4.7 删除有子菜单的菜单
echo "[4.7] 删除有子菜单的菜单"
RES=$(curl -s -X DELETE "$BASE/menus/$NEW_MENU_ID" -H "Authorization: Bearer $TOKEN")
check "有子菜单不可删除" '"存在子菜单，无法删除"' "$RES"

# 4.8 先删子菜单再删父菜单
echo "[4.8] 删除子菜单后删除父菜单"
curl -s -X DELETE "$BASE/menus/$CHILD_ID" -H "Authorization: Bearer $TOKEN" > /dev/null
RES=$(curl -s -X DELETE "$BASE/menus/$NEW_MENU_ID" -H "Authorization: Bearer $TOKEN")
check "删除叶子菜单成功" '"code":200' "$RES"

# 4.9 用户路由
echo "[4.9] 用户路由"
RES=$(curl -s "$BASE/menus/routes" -H "Authorization: Bearer $TOKEN")
check "用户路由返回" '"code":200' "$RES"

# ===== Part 5: 权限控制 =====
echo ""
echo "--- Part 5: 权限控制 ---"

# 5.1 创建无权限用户并测试
echo "[5.1] 无权限用户访问"
curl -s -X POST "$BASE/users" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"username":"noperm99","password":"123456","nickname":"无权限"}' > /dev/null
redis-cli keys "login:rate:*" 2>/dev/null | xargs -I {} redis-cli del {} 2>/dev/null
NOPERM_RES=$(curl -s -X POST "$BASE/auth/login" -H "Content-Type: application/json" -d '{"username":"noperm99","password":"123456"}')
NOPERM_TOKEN=$(echo "$NOPERM_RES" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['token'])" 2>/dev/null)
RES=$(curl -s "$BASE/users" -H "Authorization: Bearer $NOPERM_TOKEN")
check "无权限返回403" '"无权限访问"' "$RES"

# 5.2 伪造Token
echo "[5.2] 伪造Token"
RES=$(curl -s "$BASE/users" -H "Authorization: Bearer fake.token.here")
check "伪造Token返回错误" '"message"' "$RES"

# 5.3 SQL注入
echo "[5.3] SQL注入测试"
RES=$(curl -s "$BASE/users?username=OR%201%3D1" -H "Authorization: Bearer $TOKEN")
check "SQL注入不报错" '"code":200' "$RES"

# 5.4 清理
echo "[5.4] 清理测试数据"
NOPERM_ID=$(curl -s "$BASE/users?username=noperm99" -H "Authorization: Bearer $TOKEN" | python3 -c "import sys,json; data=json.load(sys.stdin)['data']; print(data['list'][0]['id'] if data['list'] else '')" 2>/dev/null)
if [ -n "$NOPERM_ID" ]; then
  curl -s -X DELETE "$BASE/users/$NOPERM_ID" -H "Authorization: Bearer $TOKEN" > /dev/null
fi
echo "  清理完成"

# ===== 结果 =====
echo ""
echo "========================================="
echo "  测试结果: $PASS 通过 / $((PASS+FAIL)) 总计"
echo "========================================="
if [ $FAIL -eq 0 ]; then
  echo "  ALL TESTS PASSED!"
else
  echo "  $FAIL test(s) FAILED"
fi