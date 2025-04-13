<template>
  <div class="page-container">
    <div class="medical-record">
      <div class="content-wrapper">
        <!-- 左侧病历输入区 -->
        <div class="panel input-panel">
          <div class="panel-header">
            <h2>病历录入</h2>
<!--            <div class="upload-wrapper">-->
<!--              <el-upload-->
<!--                  class="upload-component"-->
<!--                  :action="uploadAction"-->
<!--                  :before-upload="handleBeforeUpload"-->
<!--                  :on-success="handleUploadSuccess"-->
<!--                  :on-error="handleUploadError"-->
<!--                  :show-file-list="false"-->
<!--                  accept=".doc,.docx,.pdf"-->
<!--              >-->
<!--                <el-button type="primary" size="small">-->
<!--                  <el-icon><Upload /></el-icon>-->
<!--                  上传文件-->
<!--                </el-button>-->
<!--              </el-upload>-->
<!--              <span class="upload-tip">支持 Word、PDF 格式</span>-->
<!--            </div>-->
          </div>
          <div class="panel-content">
            <el-input
                v-model="medicalRecord"
                type="textarea"
                placeholder="请输入病历内容或上传文件..."
                class="medical-input"
            />
          </div>
        </div>

        <!-- 右侧分析区 -->
        <div class="panel analysis-panel">
          <div class="panel-header">
            <h2>智能分析</h2>
          </div>
          <div class="panel-content">
            <!-- 病历质控区域 -->
            <div class="analysis-section">
              <div class="section-header">
                <div class="title">
                  <span>病历质控</span>
                </div>
                <el-button
                    type="primary"
                    :loading="isErrorCheckLoading"
                    @click="performErrorCheck"
                    :disabled="!medicalRecord"
                >
                  开始分析
                </el-button>
              </div>
              <div class="section-content">
                <StreamMarkdown
                    :content="errorCheckContent"
                    :auto-scroll="true"
                />
              </div>
            </div>

            <!-- 修改建议区域 -->
            <div class="analysis-section">
              <div class="section-header">
                <div class="title">
                  <span>修改建议</span>
                </div>
                <el-button
                    type="primary"
                    :loading="isSuggestionLoading"
                    @click="performSuggestion"
                    :disabled="!medicalRecord || isErrorCheckLoading"
                >
                  开始分析
                </el-button>
              </div>
              <div class="section-content">
                <StreamMarkdown
                    :content="suggestionContent"
                    :auto-scroll="true"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue'
import { Upload } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import StreamMarkdown from '@/components/StreamMarkdown.vue'
import { handleDifyWorkflowStream } from '@/services/difyService'

export default {
  name: 'MedicalRecordView',
  components: {
    StreamMarkdown,
    Upload
  },
  setup() {
    const medicalRecord = ref('')
    const errorCheckContent = ref('')
    const suggestionContent = ref('')
    const isErrorCheckLoading = ref(false)
    const isSuggestionLoading = ref(false)
    
    // 文件上传相关配置
    const uploadAction = `${import.meta.env.VITE_API_BASE_URL}/api/medical-record/upload` // 上传接口地址

    // 上传前验证
    const handleBeforeUpload = (file) => {
      const isDocOrPdf = file.type === 'application/pdf' || 
                        file.type === 'application/msword' || 
                        file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      const isLt10M = file.size / 1024 / 1024 < 10

      if (!isDocOrPdf) {
        ElMessage.error('只能上传 Word/PDF 格式文件！')
        return false
      }
      if (!isLt10M) {
        ElMessage.error('文件大小不能超过 10MB！')
        return false
      }
      return true
    }

    // 上传成功回调
    const handleUploadSuccess = (response) => {
      if (response.code === 0 && response.data) {
        medicalRecord.value = response.data.content
        ElMessage.success('文件解析成功')
      } else {
        ElMessage.error(response.message || '文件解析失败')
      }
    }

    // 上传失败回调
    const handleUploadError = () => {
      ElMessage.error('文件上传失败，请重试')
    }

    // API keys
    const WORKFLOW_API_KEY = 'app-oiHK3vIKTRJyo69usNC8f2ti'
    const SUGGESTION_API_KEY = 'app-PM975zhFVIVYqsqdjymDB1J8'

    // 病历质控
    const performErrorCheck = () => {
      return handleDifyWorkflowStream({
        apiKey: WORKFLOW_API_KEY,
        inputs: { medicalRecords: medicalRecord.value },
        userId: 'medical-check-user',
        contentRef: errorCheckContent,
        loadingRef: isErrorCheckLoading
      });
    };

    // 修改建议
    const performSuggestion = () => {
      return handleDifyWorkflowStream({
        apiKey: SUGGESTION_API_KEY,
        inputs: {
          analysisSuggestion: errorCheckContent.value, // 使用病历质控的内容
          medicalRecords: medicalRecord.value
        },
        userId: 'medical-suggestion-user',
        contentRef: suggestionContent,
        loadingRef: isSuggestionLoading
      });
    };

    return {
      medicalRecord,
      errorCheckContent,
      suggestionContent,
      isErrorCheckLoading,
      isSuggestionLoading,
      performErrorCheck,
      performSuggestion,
      uploadAction,
      handleBeforeUpload,
      handleUploadSuccess,
      handleUploadError
    }
  }
}
</script>

<style scoped lang="scss">
// 自定义滚动条样式
@mixin custom-scrollbar {
  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: #dcdfe6;
    border-radius: 3px;

    &:hover {
      background: #c0c4cc;
    }
  }
}

.page-container {
  width: 100%;
  min-height: calc(100vh - 60px); // 减去顶部导航的高度
  background-color: #f5f7fa;
  overflow: hidden;
}

.medical-record {
  height: calc(100vh - 108px); // 减去顶部导航和内边距
  margin: 0 auto;
  padding: 24px;

  .content-wrapper {
    display: flex;
    gap: 24px;
    height: 100%;

    .panel {
      background: #fff;
      border-radius: 8px;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
      display: flex;
      flex-direction: column;

      &.input-panel {
        flex: 1;
        min-width: 400px;
      }

      &.analysis-panel {
        flex: 1;
        min-width: 400px;
      }

      .panel-header {
        padding: 16px 24px;
        border-bottom: 1px solid #ebeef5;
        display: flex;
        justify-content: space-between;
        align-items: center;
        height: 24px; // 固定高度

        h2 {
          margin: 0;
          font-size: 16px;
          color: #303133;
          line-height: 24px;
        }

        .upload-wrapper {
          display: flex;
          align-items: center;
          gap: 8px;
          
          .upload-component {
            :deep(.el-upload) {
              display: flex;
              align-items: center;
            }
          }

          .upload-tip {
            font-size: 12px;
            color: #909399;
            white-space: nowrap;
          }
        }
      }

      .upload-tip {
        font-size: 12px;
        color: #909399;
        margin-top: 4px;
      }

      .panel-content {
        flex: 1;
        display: flex;
        flex-direction: column;
        padding: 20px;
        overflow: hidden;

        .medical-input {
          height: 100%;

          :deep(.el-textarea__inner) {
            height: 100% !important;
            resize: none;
          }
        }

        .analysis-section {
          flex: 1; // 让每个section平均分配空间
          display: flex;
          flex-direction: column;
          min-height: 0; // 重要：防止flex子元素溢出

          .section-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 16px;

            .title {
              display: flex;
              align-items: center;
              gap: 8px;
              font-size: 15px;
              font-weight: 500;

              .icon {
                font-size: 18px;
              }
            }
          }

          .section-content {
            flex: 1;
            overflow: hidden;
            background: #f8f9fa;
            border-radius: 4px;
            padding: 16px;

            .markdown-content {
              height: 100%;
              padding: 16px;
              overflow-y: auto;
              @include custom-scrollbar;

              :deep(p) {
                margin: 8px 0;
              }

              :deep(code) {
                background-color: #f0f0f0;
                padding: 2px 4px;
                border-radius: 3px;
              }

              :deep(pre) {
                background-color: #f0f0f0;
                padding: 10px;
                border-radius: 4px;
                overflow-x: auto;
              }
            }
          }

          &:first-child {
            margin-bottom: 20px;
          }
        }
      }
    }
  }
}
</style>
