<template>
  <div class="home">
    <h1>功能导航</h1>
    <div class="feature-list">
      <el-card v-for="feature in features" 
               :key="feature.path" 
               class="feature-card"
               @click="navigateTo(feature.path)">
        <template #header>
          <div class="card-header">
            <span>{{ feature.name }}</span>
            <el-button class="button" text>
              进入 <el-icon><ArrowRight /></el-icon>
            </el-button>
          </div>
        </template>
        <div class="card-content">
          {{ feature.description }}
        </div>
      </el-card>
    </div>
  </div>
</template>

<script>
import { ArrowRight } from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'

export default {
  name: 'HomeView',
  components: {
    ArrowRight,
  },
  setup() {
    const router = useRouter()
    
    const features = [
      {
        name: '病历质控',
        path: '/medical-record',
        description: '智能病历质量控制系统，提供实时错误检查和修正建议。'
      },
      {
        name: '预问诊与病历生成',
        path: '/pre-consultation',
        description: '智能预问诊系统，通过人机对话收集病史，自动生成规范病历。'
      }
    ]

    const navigateTo = (path) => {
      router.push(path)
    }

    return {
      features,
      navigateTo
    }
  }
}
</script>

<style scoped lang="scss">
.home {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;

  h1 {
    color: #409EFF;
    margin-bottom: 30px;
    font-size: 28px;
  }

  .feature-list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 20px;
    padding: 10px;
  }

  .feature-card {
    cursor: pointer;
    transition: all 0.3s ease;

    &:hover {
      transform: translateY(-5px);
      box-shadow: 0 2px 12px 0 rgba(0,0,0,.1);
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      
      span {
        font-size: 16px;
        font-weight: bold;
      }
    }

    .card-content {
      color: #666;
      font-size: 14px;
      line-height: 1.5;
    }
  }
}
</style>