<template>
  <div class="stream-markdown" ref="markdownContainer">
    <div class="markdown-content" v-html="renderedContent"></div>
  </div>
</template>

<script>
import { ref, watch, onMounted } from 'vue'
import { marked } from 'marked'
import hljs from 'highlight.js'
import 'highlight.js/styles/github.css'

export default {
  name: 'StreamMarkdown',
  props: {
    content: {
      type: String,
      default: ''
    },
    autoScroll: {
      type: Boolean,
      default: true
    }
  },

  setup(props) {
    const markdownContainer = ref(null)
    const renderedContent = ref('')

    // 配置 marked
    marked.setOptions({
      highlight: function (code, lang) {
        if (lang && hljs.getLanguage(lang)) {
          return hljs.highlight(lang, code).value
        }
        return hljs.highlightAuto(code).value
      },
      breaks: true,
      gfm: true
    })

    // 初始化内容
    onMounted(() => {
      if (props.content) {
        renderedContent.value = marked(props.content)
      }
    })

    // 监听内容变化
    watch(() => props.content, (newContent) => {
      if (newContent) {
        renderedContent.value = marked(newContent)
        
        if (props.autoScroll) {
          setTimeout(() => {
            scrollToBottom()
          }, 0)
        }
      }
    }, { immediate: true }) // 添加 immediate: true 确保立即执行一次

    // 滚动到底部
    const scrollToBottom = () => {
      if (markdownContainer.value) {
        markdownContainer.value.scrollTop = markdownContainer.value.scrollHeight
      }
    }

    return {
      markdownContainer,
      renderedContent
    }
  }
}
</script>

<style lang="scss" scoped>
.stream-markdown {
  height: 100%;
  overflow-y: auto;

  .markdown-content {
    
    :deep() {
      h1, h2, h3, h4, h5, h6 {
        margin-top: 1em;
        margin-bottom: 0.5em;
        font-weight: 600;
      }

      h1 { font-size: 2em; }
      h2 { font-size: 1.5em; }
      h3 { font-size: 1.25em; }

      p {
        margin: 0.5em 0;
        line-height: 1.6;
      }

      ul, ol {
        padding-left: 1.5em;
        margin: 0.5em 0;
      }

      code {
        background-color: #f5f5f5;
        padding: 0.2em 0.4em;
        border-radius: 3px;
        font-family: monospace;
        font-size: 0.9em;
      }

      pre {
        background-color: #f5f5f5;
        padding: 1em;
        border-radius: 4px;
        overflow-x: auto;
        margin: 0.5em 0;

        code {
          background-color: transparent;
          padding: 0;
        }
      }

      blockquote {
        margin: 0.5em 0;
        padding: 0.5em 1em;
        border-left: 4px solid #ddd;
        background-color: #f9f9f9;
      }

      table {
        border-collapse: collapse;
        width: 100%;
        margin: 0.5em 0;

        th, td {
          border: 1px solid #ddd;
          padding: 8px;
          text-align: left;
        }

        th {
          background-color: #f5f5f5;
        }
      }

      img {
        max-width: 100%;
        height: auto;
      }
    }
  }
}
</style>