<template>
  <div class="log-page">
    <el-card>
      <el-tabs v-model="activeTab" @tab-change="handleTabChange">
        <el-tab-pane label="登录日志" name="login">
          <el-form :inline="true" :model="search" class="search-form">
            <el-form-item label="用户名">
              <el-input v-model="search.username" placeholder="请输入用户名" clearable />
            </el-form-item>
            <el-form-item label="状态">
              <el-select v-model="search.status" placeholder="全部" clearable style="width: 120px">
                <el-option label="成功" :value="1" />
                <el-option label="失败" :value="0" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="handleSearch">搜索</el-button>
              <el-button @click="handleReset">重置</el-button>
            </el-form-item>
          </el-form>

          <el-table :data="loginTableData" v-loading="loading">
            <el-table-column prop="username" label="用户名" min-width="120" />
            <el-table-column prop="ip" label="IP 地址" min-width="130" />
            <el-table-column prop="msg" label="说明" min-width="180" show-overflow-tooltip />
            <el-table-column prop="status" label="状态" width="90">
              <template #default="{ row }">
                <el-tag :type="row.status === 1 ? 'success' : 'danger'" size="small">
                  {{ row.status === 1 ? '成功' : '失败' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="createTime" label="登录时间" min-width="170" />
          </el-table>
        </el-tab-pane>

        <el-tab-pane label="操作日志" name="operation">
          <el-form :inline="true" :model="search" class="search-form">
            <el-form-item label="用户名">
              <el-input v-model="search.username" placeholder="请输入用户名" clearable />
            </el-form-item>
            <el-form-item label="模块">
              <el-input v-model="search.module" placeholder="请输入模块" clearable />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="handleSearch">搜索</el-button>
              <el-button @click="handleReset">重置</el-button>
            </el-form-item>
          </el-form>

          <el-table :data="operationTableData" v-loading="loading">
            <el-table-column prop="username" label="操作人" min-width="110" />
            <el-table-column prop="module" label="模块" min-width="100" />
            <el-table-column prop="action" label="动作" min-width="100" />
            <el-table-column prop="method" label="方法" width="80" />
            <el-table-column prop="url" label="接口地址" min-width="200" show-overflow-tooltip />
            <el-table-column prop="duration" label="耗时(ms)" width="90" />
            <el-table-column prop="status" label="状态" width="80">
              <template #default="{ row }">
                <el-tag :type="row.status === 200 ? 'success' : 'danger'" size="small">
                  {{ row.status ?? '-' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="90" fixed="right">
              <template #default="{ row }">
                <el-button link type="primary" v-auth="P.System.Log.Query" @click="handleView(row)">详情</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
      </el-tabs>

      <div class="pagination">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.size"
          :total="pagination.total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next"
          @current-change="fetchData"
          @size-change="fetchData"
        />
      </div>
    </el-card>

    <el-drawer v-model="detailVisible" title="操作日志详情" size="480px">
      <el-descriptions :column="1" border v-if="currentDetail">
        <el-descriptions-item label="ID">{{ currentDetail.id }}</el-descriptions-item>
        <el-descriptions-item label="操作人">{{ currentDetail.username || '-' }}</el-descriptions-item>
        <el-descriptions-item label="模块">{{ currentDetail.module || '-' }}</el-descriptions-item>
        <el-descriptions-item label="动作">{{ currentDetail.action || '-' }}</el-descriptions-item>
        <el-descriptions-item label="方法">{{ currentDetail.method || '-' }}</el-descriptions-item>
        <el-descriptions-item label="接口">{{ currentDetail.url || '-' }}</el-descriptions-item>
        <el-descriptions-item label="IP">{{ currentDetail.ip || '-' }}</el-descriptions-item>
        <el-descriptions-item label="耗时">{{ currentDetail.duration ?? '-' }} ms</el-descriptions-item>
        <el-descriptions-item label="状态">{{ currentDetail.status ?? '-' }}</el-descriptions-item>
        <el-descriptions-item label="请求参数">
          <pre class="detail-pre">{{ currentDetail.params || '-' }}</pre>
        </el-descriptions-item>
        <el-descriptions-item label="返回结果">
          <pre class="detail-pre">{{ currentDetail.result || '-' }}</pre>
        </el-descriptions-item>
        <el-descriptions-item label="错误信息">
          <pre class="detail-pre">{{ currentDetail.errorMsg || '-' }}</pre>
        </el-descriptions-item>
        <el-descriptions-item label="时间">{{ currentDetail.createTime }}</el-descriptions-item>
      </el-descriptions>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { P } from '@/router/routes/asyncRoutes'
import { getLoginLogListApi, getOperationLogListApi, getOperationLogByIdApi } from '@/api/log'
import type { LoginLog, OperationLog } from '@/api/log'

const activeTab = ref<'login' | 'operation'>('login')
const loading = ref(false)
const loginTableData = ref<LoginLog[]>([])
const operationTableData = ref<OperationLog[]>([])
const detailVisible = ref(false)
const currentDetail = ref<OperationLog | null>(null)

const search = reactive({ username: '', module: '', status: undefined as number | undefined })
const pagination = reactive({ page: 1, size: 10, total: 0 })

async function fetchData() {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      size: pagination.size,
      username: search.username || undefined,
      module: search.module || undefined,
      status: activeTab.value === 'login' ? search.status : undefined
    }
    if (activeTab.value === 'login') {
      const res = await getLoginLogListApi(params)
      loginTableData.value = res.data || []
      pagination.total = res.pagination?.total || 0
    } else {
      const res = await getOperationLogListApi(params)
      operationTableData.value = res.data || []
      pagination.total = res.pagination?.total || 0
    }
  } catch (e) {
    console.error('[log] fetchData error:', e)
    ElMessage.error('获取日志列表失败')
  } finally {
    loading.value = false
  }
}

function handleTabChange() {
  pagination.page = 1
  fetchData()
}

function handleSearch() {
  pagination.page = 1
  fetchData()
}

function handleReset() {
  search.username = ''
  search.module = ''
  search.status = undefined
  handleSearch()
}

async function handleView(row: OperationLog) {
  try {
    const res = await getOperationLogByIdApi(row.id)
    currentDetail.value = res.data
    detailVisible.value = true
  } catch (e) {
    console.error('[log] view detail error:', e)
  }
}

onMounted(() => fetchData())
</script>

<style scoped lang="scss">
.log-page {
  .search-form { margin-bottom: 16px; }
  .pagination {
    margin-top: 16px;
    display: flex;
    justify-content: flex-end;
  }
  .detail-pre {
    margin: 0;
    white-space: pre-wrap;
    word-break: break-all;
    max-height: 200px;
    overflow: auto;
  }
}
</style>