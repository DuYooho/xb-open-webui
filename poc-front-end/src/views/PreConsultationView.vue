<template>
  <div class="page-container">
    <div class="pre-consultation">
      <div class="content-wrapper">
        <!-- 左侧问诊对话区 -->
        <div class="panel chat-panel">
          <div class="panel-header">
            <h2>智能预问诊</h2>
          </div>
          <div class="panel-content">
            <!-- 对话历史区域 -->
            <div class="chat-history" ref="chatHistoryRef">
              <div v-for="(message, index) in chatHistory"
                   :key="index"
                   :class="['message', message.role]">
                <div class="message-content">
                  <div v-if="message.role === 'assistant'" class="markdown-wrapper">
                    <stream-markdown
                        :content="message.content"
                        :auto-scroll="false"
                    />
                  </div>
                  <div v-else class="text-wrapper">
                    {{ message.content }}
                  </div>
                </div>
              </div>
            </div>
            <!-- 输入区域 -->
            <div class="chat-input">
              <el-input
                  v-model="userInput"
                  type="textarea"
                  :rows="3"
                  resize="none"
                  :disabled="isConversationEnded"
                  :placeholder="isConversationEnded ? '对话已结束' : '请描述您的症状，输入 enter 发送'"
                  @keyup.enter="sendMessage"
              />
              <el-button
                  v-if="isConversationEnded"
                  type="primary"
                  class="restart-button"
                  @click="resetConversation"
              >
                重新开始对话
              </el-button>
            </div>
          </div>
        </div>

        <!-- 右侧HIS系统区 -->
        <div class="panel his-panel">
          <div class="panel-header">
            <h2>HIS系统</h2>
          </div>
          <div 
            class="panel-content"
            v-loading="isHisLoading"
            :element-loading-text="hisLoadingText"
            element-loading-background="rgba(255, 255, 255, 0.9)"
          >
            <!-- 病人信息区域 -->
            <div class="analysis-section">
              <div class="section-header">
                <div class="title">
                  <span>病人信息</span>
                </div>
              </div>
              <div class="section-content">
                <el-descriptions :column="2" border>
                  <!-- 基本信息 - 预问诊场景下只需要基础个人信息 -->
                  <el-descriptions-item v-if="patientInfo.name" label="姓名">{{ patientInfo.name }}
                  </el-descriptions-item>
                  <el-descriptions-item v-if="patientInfo.gender" label="性别">{{ patientInfo.gender }}
                  </el-descriptions-item>
                  <el-descriptions-item v-if="patientInfo.age" label="年龄">{{ patientInfo.age }}</el-descriptions-item>
                  <el-descriptions-item v-if="patientInfo.phone" label="联系电话">{{ patientInfo.phone }}
                  </el-descriptions-item>

                  <!-- 医保相关 - 可能影响后续就医选择 -->
                  <el-descriptions-item v-if="patientInfo.medicalInsuranceType" label="医保类型">
                    {{ patientInfo.medicalInsuranceType }}
                  </el-descriptions-item>
                </el-descriptions>
              </div>
            </div>

            <!-- 病历信息区域 -->
            <div class="analysis-section">
              <div class="section-header">
                <div class="title">
                  <span>病历信息</span>
                </div>
              </div>
              <div class="section-content">
                <div class="record-section">
                  <h3 class="record-title">主诉</h3>
                  <div class="content-wrapper">
                    <el-input
                        v-model="medicalRecords.chiefComplaint"
                        type="textarea"
                        :rows="2"
                        resize="none"
                    />
                  </div>
                </div>

                <div class="record-section">
                  <h3 class="record-title">现病史</h3>
                  <div class="content-wrapper">
                    <el-input
                        v-model="medicalRecords.presentIllnessHistory"
                        type="textarea"
                        :rows="4"
                        resize="none"
                    />
                  </div>
                </div>

                <div class="record-section">
                  <h3 class="record-title">既往史及其他</h3>
                  <div class="content-wrapper">
                    <el-input
                        v-model="medicalRecords.pastMedicalHistory"
                        type="textarea"
                        :rows="4"
                        resize="none"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import {ref, nextTick} from 'vue'
import {ElMessage} from 'element-plus'
import {handleDifyChatStream, handleDifyWorkflowBlocking} from '@/services/difyService'
import StreamMarkdown from '@/components/StreamMarkdown.vue'

export default {
  name: 'PreConsultationView',
  components: {
    StreamMarkdown
  },
  setup() {
    const chatHistoryRef = ref(null)

    // 滚动到底部的函数
    const scrollToBottom = async () => {
      await nextTick()
      if (chatHistoryRef.value) {
        chatHistoryRef.value.scrollTop = chatHistoryRef.value.scrollHeight
      }
    }

    const patientInfo = ref({
      // 基本信息
      name: '张三',
      gender: '男',
      age: '45岁',
      phone: '*',

      // 医保信息
      medicalInsuranceType: '城镇职工医保',
    })

    const userInput = ref('')
    const isLoading = ref(false)
    const chatHistory = ref([
      {
        role: 'assistant',
        content: '您好，我是您的智能问诊助手。请描述您的症状，我会协助您进行初步诊断。'
      }
    ])

    const medicalRecords = ref({
      chiefComplaint: '',
      presentIllnessHistory: '',
      pastMedicalHistory: ''
    })

    // 添加 conversationId ref
    const conversationId = ref('')

    // 添加新的响应式变量
    const isConversationEnded = ref(false)
    const isResponding = ref(false)  // 用于控制 AI 是否正在回答
    
    // 重置对话的方法
    const resetConversation = () => {
      chatHistory.value = [{
        role: 'assistant',
        content: '您好，我是您的智能问诊助手。请描述您的症状，我会协助您进行初步诊断。'
      }]
      userInput.value = ''
      isConversationEnded.value = false
      conversationId.value = ''
      medicalRecords.value = {
        chiefComplaint: '',
        presentIllnessHistory: '',
        pastMedicalHistory: ''
      }
    }

    // 添加 HIS 系统加载状态
    const isHisLoading = ref(false)
    const hisLoadingText = ref('正在导入 HIS 系统...')

    // 处理对话结束的方法
    const handleConversationEnd = async () => {
      try {
        // 获取AI的最后一个回答
        const lastAssistantMessage = chatHistory.value
          .filter(msg => msg.role === 'assistant')
          .pop();

        if (!lastAssistantMessage) return;

        // 设置 HIS 加载状态
        isHisLoading.value = true
        
        // 调用 Dify API 处理病历 (使用新的同步方法)
        const response = await handleDifyWorkflowBlocking({
          apiKey: 'app-aJlIr8g6yXR3zeNnvLogr4lZ',
          inputs: {
            lastChatRecord: lastAssistantMessage.content
          },
          userId: 'medical-record-processor'
        });

        // 处理返回数据
        if (response?.data?.outputs?.result) {
          const result = response.data.outputs.result;
          console.log('result', result)
          // 直接使用返回的对象，不需要 JSON.parse
          medicalRecords.value = {
            chiefComplaint: result.chiefComplaint || '',
            presentIllnessHistory: result.presentIllnessHistory || '',
            pastMedicalHistory: result.pastMedicalHistory || ''
          };
        } else {
          throw new Error('未获取到有效的病历数据');
        }

        // 模拟 HIS 系统处理延迟
        await new Promise(resolve => setTimeout(resolve, 1500));

        isHisLoading.value = false;
        ElMessage.success('病历信息已成功导入 HIS 系统');
        isConversationEnded.value = true;
      } catch (error) {
        isHisLoading.value = false;
        ElMessage.error('处理病历记录时出错');
        console.error('处理病历记录错误:', error);
      }
    }

    const sendMessage = async () => {
      // 检查输入是否为空、对话是否结束、是否正在响应
      if (!userInput.value.trim() || isConversationEnded.value || isResponding.value) return

      const message = userInput.value
      userInput.value = ''
      isResponding.value = true

      chatHistory.value.push({
        role: 'user',
        content: message
      })

      await scrollToBottom()

      // 添加 AI 回复占位
      const aiMessageIndex = chatHistory.value.length
      chatHistory.value.push({
        role: 'assistant',
        content: ''
      })

      isLoading.value = true
      try {
        const requestParams = {
          apiKey: 'app-5nzR2Fg9oyZqfnXIMzPOZIHs',
          query: message,
          userId: 'pre-consultation-user',
          conversationId: conversationId.value,
          contentRef: ref(''),
          loadingRef: isLoading,
        }

        if (!conversationId.value) {
          requestParams.inputs = {
            patientInfo: `${patientInfo.value.name}，${patientInfo.value.gender}，${patientInfo.value.age}`
          }
        }

        await handleDifyChatStream({
          ...requestParams,
          onProgress: async (event, data) => {
            if (event === 'message') {
              const assistantMessage = chatHistory.value[aiMessageIndex]
              if (assistantMessage?.role === 'assistant') {
                assistantMessage.content += data.answer
                await scrollToBottom()
              }

              if (data.conversation_id && !conversationId.value) {
                conversationId.value = data.conversation_id
              }
            } else if (event === 'message_end') {
              if (data.conversation_id) {
                conversationId.value = data.conversation_id
              }
              
              const lastMessage = chatHistory.value[chatHistory.value.length - 1]
              if (lastMessage.role === 'assistant' && 
                  lastMessage.content.includes('谢谢您的耐心回答，我会把预问诊结果整理给医生，祝您早日康复！')) {
                await handleConversationEnd()
              }
              
              await scrollToBottom()
              isResponding.value = false  // 响应结束，重置状态
            }
          },
          onMetadata: (metadata) => {
            console.log('Usage metadata:', metadata.usage)
          },
          onTTS: (ttsData) => {
            if (ttsData.type === 'chunk') {
              console.log('Received TTS chunk:', ttsData.audio)
            }
          }
        })
      } catch (error) {
        // 在 AI 回复中显示错误信息
        const errorMessage = error?.message || '发送消息失败，请重试'
        chatHistory.value[aiMessageIndex] = {
          role: 'assistant',
          content: `**错误提示：** ${errorMessage}`
        }
        await scrollToBottom()
        ElMessage.error(errorMessage)
      } finally {
        isLoading.value = false
        isResponding.value = false  // 确保在任何情况下都重置响应状态
      }
    }

    return {
      chatHistoryRef,
      patientInfo,
      userInput,
      isLoading,
      chatHistory,
      medicalRecords,
      conversationId, // 如果需要在模板中使用
      isConversationEnded,
      isResponding,  // 导出以供模板使用
      resetConversation,
      sendMessage,
      isHisLoading,
      hisLoadingText
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
  min-height: calc(100vh - 60px);
  background-color: #f5f7fa;
  overflow: hidden;
}

.pre-consultation {
  height: calc(100vh - 108px);
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

      &.chat-panel {
        flex: 1;
        min-width: 400px;
      }

      &.his-panel {
        flex: 1;
        min-width: 400px;
        position: relative; // 为加载遮罩提供定位上下文
        
        // 自定义加载样式
        :deep(.el-loading-mask) {
          border-radius: 8px;
          
          .el-loading-text {
            color: #409EFF;
            font-size: 14px;
            margin-top: 10px;
          }
        }
      }

      .panel-header {
        padding: 16px 24px;
        border-bottom: 1px solid #ebeef5;
        display: flex;
        justify-content: space-between;
        align-items: center;
        height: 24px;

        h2 {
          margin: 0;
          font-size: 16px;
          color: #303133;
          line-height: 24px;
        }
      }

      .panel-content {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 20px;
        padding: 16px;
        overflow: auto;

        // 聊天记录区域优化
        .chat-history {
          flex: 1;
          overflow-y: auto;
          padding-right: 8px;
          padding-bottom: 16px; // 增加底部间距
          @include custom-scrollbar;

          .message {
            margin-bottom: 16px;
            display: flex;
            flex-direction: column;

            &.user {
              align-items: flex-end;

              .message-content {
                background-color: #409EFF;
                color: white;
                border-radius: 16px 2px 16px 16px;
                box-shadow: 0 2px 4px rgba(64, 158, 255, 0.1);

                :deep(.markdown-body) {
                  color: white;
                }
              }
            }

            &.assistant {
              align-items: flex-start;

              .message-content {
                background-color: #f5f7fa;
                border-radius: 2px 16px 16px 16px;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
                width: fit-content;
              }
            }

            .message-content {
              max-width: 80%;
              padding: 12px 16px;
              word-break: break-word;
              line-height: 1.6;
              font-size: 14px;

              .markdown-wrapper, .text-wrapper {
                color: inherit;
              }
            }
          }
        }

        // 输入区域样式优化
        .chat-input {
          position: relative;
          margin-top: auto;
          padding: 16px;
          background: #fff;
          border-top: 1px solid #ebeef5;
          display: flex;
          flex-direction: column;
          gap: 12px;

          .restart-button {
            align-self: center;
            margin-top: 8px;
          }

          .el-input {
            &.is-disabled {
              .el-textarea__inner {
                background-color: #f5f7fa;
                border-color: #e4e7ed;
                color: #909399;
                cursor: not-allowed;
              }
            }
          }

          .el-input {
            position: relative;

            :deep(.el-textarea__inner) {
              padding: 12px 16px;
              height: 60px; // 固定高度
              resize: none !important; // 强制禁止调整大小
              border-radius: 12px;
              border: 1px solid #dcdfe6;
              background: #f9fafc;
              font-size: 14px;
              line-height: 1.6;
              transition: all 0.25s ease;
              overflow-y: auto; // 允许内容滚动

              &::placeholder {
                color: #909399;
              }

              &:hover {
                background: #fff;
                border-color: #c0c4cc;
              }

              &:focus {
                background: #fff;
                border-color: #409EFF;
                box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.1);
              }
            }
          }

          // 发送提示样式优化
          .send-tip {
            text-align: center;
            margin-top: 4px;

            span {
              display: inline-block;
              font-size: 12px;
              color: #909399;
              background-color: #f5f7fa;
              border: 1px solid #e4e7ed;
              border-radius: 4px;
              padding: 2px 8px;
            }
          }
        }

        // HIS面板内容区
        .analysis-section {
          background: #fff;
          border-radius: 8px;

          .section-header {
            padding: 12px 16px;
            border-bottom: 1px solid #ebeef5;

            .title {
              font-size: 15px;
              font-weight: 500;
              color: #303133;
            }
          }

          .section-content {
            padding: 12px;

            .record-section {
              margin-bottom: 16px;

              &:last-child {
                margin-bottom: 0;
              }

              .record-title {
                font-size: 15px;
                font-weight: 500;
                color: #303133;
                margin: 0 0 8px 0;
              }

              .content-wrapper {
                :deep(.el-textarea__inner) {
                  font-size: 14px;
                  color: #303133;
                  line-height: 1.6;

                  &::placeholder {
                    color: #909399;
                  }
                }
              }
            }

            @include custom-scrollbar;
          }
        }

        @include custom-scrollbar;
      }
    }
  }
}
</style>
