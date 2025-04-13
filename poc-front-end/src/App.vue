<template>
  <div class="app-container">
    <!-- 顶部导航栏 -->
    <header class="app-header">
      <div class="header-content">
        <div class="left">
          <h1 class="logo">医疗Agent插件库</h1>
          <nav class="main-nav">
            <router-link to="/" class="nav-item">首页</router-link>
            <router-link to="/medical-record" class="nav-item">病历质控</router-link>
            <router-link to="/pre-consultation" class="nav-item">预问诊与病历生成</router-link>
          </nav>
        </div>
      </div>
    </header>

    <!-- 主要内容区 -->
    <main class="app-main">
      <router-view></router-view>
    </main>
  </div>
</template>

<script>
export default {
  name: 'App'
}
</script>

<style lang="scss">
body {
  margin: 0;
  padding: 0;
  font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
}

.app-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f5f7fa;
}

.app-header {
  height: 60px;
  background-color: #fff;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;

  .header-content {
    max-width: 1800px;
    height: 100%;
    margin: 0 auto;
    padding: 0 24px;
    display: flex;
    justify-content: space-between;
    align-items: center;

    .left {
      display: flex;
      align-items: center;
      gap: 48px;

      .logo {
        margin: 0;
        font-size: 20px;
        color: #409EFF;
      }

      .main-nav {
        display: flex;
        gap: 24px;

        .nav-item {
          text-decoration: none;
          color: #606266;
          font-size: 15px;
          padding: 8px 12px;
          border-radius: 4px;
          transition: all 0.3s ease;

          &:hover {
            color: #409EFF;
            background-color: #ecf5ff;
          }

          &.router-link-active {
            color: #409EFF;
            background-color: #ecf5ff;
            font-weight: 500;
          }
        }
      }
    }
  }
}

.app-main {
  margin-top: 60px; // 为固定定位的header留出空间
  flex: 1;
}
</style>
