
import { fetchEventSource } from "@microsoft/fetch-event-source";
import { apiConfig } from '@/config';

/**
 * 处理 Dify Workflows 的流式请求
 * @param {Object} options 配置选项
 * @param {string} options.apiKey - Dify API Key
 * @param {Object} options.inputs - 输入参数对象，注意这里应该是普通对象而不是ref
 * @param {string} options.userId - 用户标识
 * @param {Ref} options.contentRef - Vue ref 用于存储响应内容
 * @param {Ref} options.loadingRef - Vue ref 用于控制加载状态
 * @param {Function} [options.onProgress] - 可选的进度回调函数
 * @param {string} [options.baseURL] - 可选的基础URL，默认使用配置中的baseURL
 * @returns {Promise<void>}
 */
export const handleDifyWorkflowStream = async ({
  apiKey,
  inputs,
  userId,
  contentRef,
  loadingRef,
  onProgress,
  baseURL = apiConfig.baseURL
}) => {
  if (!inputs) return;

  loadingRef.value = true;
  contentRef.value = '';

  try {
    await fetchEventSource(
      `${baseURL}/v1/workflows/run`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          inputs: inputs,  // 这里应该已经是普通对象
          user: userId,
          response_mode: 'streaming'
        }),
        onopen(response) {
          if (!response.ok) {
            throw new Error("请求失败");
          }
          console.log('流式连接已建立');
        },
        onmessage(event) {

          try {
            const data = JSON.parse(event.data);

            // 处理内容
            if (data.event === 'text_chunk') {
              const text = data.data.text;
              contentRef.value += text;
            } else {
              const content = data.data?.outputs?.content ||
                            data.data?.content ||
                            data.content;

              if (content) {
                contentRef.value += content;
              }
            }

            // 处理进度
            if (onProgress) {
              onProgress(data.event);
            }
          } catch (error) {
            console.error('JSON解析错误:', error);
            console.error('原始数据:', event.data);
          }
        },
        onclose() {
          console.log('流关闭');
        },
        onerror(err) {
          console.error('流错误:', err);
          throw err;
        }
      }
    );
  } catch (error) {
    console.error('Stream request error:', error);
    contentRef.value = '**错误：** 处理过程中出现错误，请稍后重试。';
  } finally {
    loadingRef.value = false;
  }
};

/**
 * 处理 Dify Chat Messages 的流式请求
 * @param {Object} options 配置选项
 * @param {string} options.apiKey - Dify API Key
 * @param {Object} options.inputs - 输入参数对象
 * @param {string} options.query - 用户查询内容
 * @param {string} options.userId - 用户标识
 * @param {string} [options.conversationId] - 可选的对话ID
 * @param {Array} [options.files] - 可选的文件数组
 * @param {Ref} options.contentRef - Vue ref 用于存储响应内容
 * @param {Ref} options.loadingRef - Vue ref 用于控制加载状态
 * @param {Function} [options.onProgress] - 可选的进度回调函数
 * @param {Function} [options.onMetadata] - 可选的元数据回调函数
 * @param {Function} [options.onTTS] - 可选的语音合成回调函数
 * @param {string} [options.baseURL] - 可选的基础URL，默认使用配置中的baseURL
 * @returns {Promise<void>}
 */
export const handleDifyChatStream = async ({
  apiKey,
  inputs = {},
  query,
  userId,
  conversationId = '',
  files = [],
  contentRef,
  loadingRef,
  onProgress,
  onMetadata,
  onTTS,
  baseURL = apiConfig.baseURL
}) => {
  if (!query) return;

  loadingRef.value = true;
  contentRef.value = '';

  try {
    await fetchEventSource(
      `${baseURL}/v1/chat-messages`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          inputs,
          query,
          response_mode: 'streaming',
          conversation_id: conversationId,
          user: userId,
          files
        }),
        onopen(response) {
          if (!response.ok) {
            throw new Error(`请求失败: ${response.status}`);
          }
          console.log('流式连接已建立');
        },
        onmessage(event) {
          try {
            const data = JSON.parse(event.data);
            
            // 处理不同类型的事件
            switch (data.event) {
              case 'message':
                // 处理消息内容
                contentRef.value += data.answer;
                break;
                
              case 'message_end':
                // 处理消息结束事件，包含元数据
                if (onMetadata) {
                  onMetadata(data.metadata);
                }
                break;
                
              case 'tts_message':
                // 处理语音合成消息
                if (onTTS) {
                  onTTS({
                    type: 'chunk',
                    audio: data.audio,
                    messageId: data.message_id
                  });
                }
                break;
                
              case 'tts_message_end':
                // 处理语音合成结束事件
                if (onTTS) {
                  onTTS({
                    type: 'end',
                    messageId: data.message_id
                  });
                }
                break;
            }

            // 如果存在进度回调，则调用
            if (onProgress) {
              onProgress(data.event, data);
            }
          } catch (error) {
            console.error('JSON解析错误:', error);
            console.error('原始数据:', event.data);
          }
        },
        onclose() {
          console.log('流关闭');
        },
        onerror(err) {
          console.error('流错误:', err);
          throw err;
        }
      }
    );
  } catch (error) {
    console.error('Stream request error:', error);
    contentRef.value = '**错误：** 处理过程中出现错误，请稍后重试。';
    throw error;
  } finally {
    loadingRef.value = false;
  }
};

/**
 * 处理 Dify Workflows 的同步请求
 * @param {Object} options 配置选项
 * @param {string} options.apiKey - Dify API Key
 * @param {Object} options.inputs - 输入参数对象
 * @param {string} options.userId - 用户标识
 * @param {string} [options.baseURL] - 可选的基础URL，默认使用配置中的baseURL
 * @returns {Promise<Object>} 返回处理结果
 */
export const handleDifyWorkflowBlocking = async ({
  apiKey,
  inputs,
  userId,
  baseURL = apiConfig.baseURL
}) => {
  if (!inputs) return null;

  try {
    const response = await fetch(`${baseURL}/v1/workflows/run`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        inputs: inputs,
        user: userId,
        response_mode: 'blocking'
      })
    });

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }

    const result = await response.json();
    
    // 检查执行状态
    if (result.data.status !== 'succeeded') {
      throw new Error(result.data.error || 'Workflow execution failed');
    }

    return result;
  } catch (error) {
    console.error('Blocking request error:', error);
    throw error;
  }
};

