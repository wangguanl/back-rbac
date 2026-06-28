# 后端-Phase 4：测试验收（0.5天）

> 所属项目：RBAC 权限管理系统
> 执行顺序：后端第4阶段（最终阶段）
> 预计耗时：0.5天
> 前置依赖：后端-Phase 3 - 权限核心
> 下一阶段：前端-Phase 1 - 基础搭建

---

## 目标

对后端所有接口进行全面测试，验证权限控制，确保后端功能完整可用后交付给前端对接。

---

## 测试清单

### 一、认证模块测试

| 用例 | 步骤 | 预期结果 |
|------|------|----------|
| 正常登录 | POST /api/auth/login admin/123456 | 返回token和userInfo |
| 错误密码 | 输入错误密码 | 401，"用户名或密码错误" |
| 禁用账号 | 使用status=0的账号 | 401，"账号已被禁用" |
| Token验证 | 带Token请求userinfo | 返回用户信息和权限列表 |
| 无Token请求 | 不带Token请求userinfo | 401，"未登录" |
| Token过期 | 使用过期Token | 401，跳转登录提示 |
| 登出 | POST /api/auth/logout | 成功退出 |

### 二、用户模块测试

| 用例 | 步骤 | 预期结果 |
|------|------|----------|
| 用户列表 | GET /api/users?page=1&size=10 | 返回分页数据 |
| 用户搜索 | username参数筛选 | 筛选结果正确 |
| 新增用户 | POST /api/users | 创建成功 |
| 重复用户名 | 使用已存在用户名 | 400，"用户名已存在" |
| 编辑用户 | PUT /api/users/:id | 更新成功 |
| 删除用户 | DELETE /api/users/:id（非admin） | 删除成功 |
| 删除admin | DELETE /api/users/1 | 400，"超级管理员不可删除" |
| 分配角色 | PUT /api/users/:id/roles | 角色分配成功 |
| 重置密码 | PUT /api/users/:id/password | 密码重置成功 |

### 三、角色模块测试

| 用例 | 步骤 | 预期结果 |
|------|------|----------|
| 角色列表 | GET /api/roles | 返回角色列表 |
| 新增角色 | POST /api/roles | 创建成功 |
| 重复角色编码 | 使用已存在code | 400，"角色代码已存在" |
| 编辑角色 | PUT /api/roles/:id | 更新成功 |
| 删除角色 | DELETE /api/roles/:id（非admin） | 删除成功 |
| 删除admin角色 | DELETE /api/roles/1 | 400，"不可删除" |
| 删除有用户的角色 | 删除有用户的角色 | 400，"存在用户不可删除" |
| 分配权限 | POST /api/roles/:id/menus | 权限分配成功 |
| 获取角色菜单 | GET /api/roles/:id/menus | 返回菜单ID列表 |

### 四、菜单模块测试

| 用例 | 步骤 | 预期结果 |
|------|------|----------|
| 菜单树 | GET /api/menus/tree | 返回树形结构 |
| 菜单列表 | GET /api/menus | 返回平铺列表 |
| 新增目录 | POST /api/menus (type=0) | 创建成功 |
| 新增菜单 | POST /api/menus (type=1) | 创建成功 |
| 新增按钮 | POST /api/menus (type=2) | 创建成功 |
| 编辑菜单 | PUT /api/menus/:id | 更新成功 |
| 删除有子菜单 | DELETE有子级的菜单 | 400，"存在子菜单不可删除" |
| 删除叶子菜单 | DELETE无子级的菜单 | 删除成功 |
| 用户路由 | GET /api/menus/routes | 返回用户可访问路由 |

### 五、权限控制测试

| 用例 | 步骤 | 预期结果 |
|------|------|----------|
| 无权限访问接口 | 使用无权限账号请求 | 403，"无权限访问" |
| Token伪造 | 使用伪造Token | 401 |
| SQL注入 | 输入 `' OR '1'='1` | 无报错，正常处理 |

---

## 测试工具

- **Postman / Apifox** - API接口测试
- **Prisma Studio** - 数据库可视化查看

---

## 验收标准

- [x] 所有认证接口正常（7个）
- [x] 所有用户接口正常（7个）
- [x] 所有角色接口正常（7个）
- [x] 所有菜单接口正常（7个）
- [x] 权限控制正确（无权限返回403）
- [x] SQL注入无风险
- [x] 数据库数据正确
- [x] 服务稳定运行

---

## Postman测试脚本示例

```bash
# 1. 登录获取Token
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"123456"}' | jq -r '.data.token')

echo "Token: $TOKEN"

# 2. 测试用户列表
curl -s http://localhost:3000/api/users?page=1&size=10 \
  -H "Authorization: Bearer $TOKEN" | jq

# 3. 测试角色列表
curl -s http://localhost:3000/api/roles \
  -H "Authorization: Bearer $TOKEN" | jq

# 4. 测试菜单树
curl -s http://localhost:3000/api/menus/tree \
  -H "Authorization: Bearer $TOKEN" | jq

# 5. 测试用户路由
curl -s http://localhost:3000/api/menus/routes \
  -H "Authorization: Bearer $TOKEN" | jq
```

---

## 交付物清单

后端开发完成后，向前端交付：

1. **API接口文档** - 所有接口的请求/响应格式
2. **接口地址** - http://localhost:3000/api
3. **测试账号** - admin / 123456
4. **权限标识列表** - user:list, user:add, role:list 等

---

## 后端完成确认

后端全部完成后，进入 **前端-Phase 1 - 基础搭建**。

---

## 参考文档

- [RBAC后端方案.md](RBAC后端方案.md)
- [后端-Phase 3 - 权限核心.md](后端-Phase%203%20-%20权限核心.md)