import Context from '@/models/Context'
import bot from '@/helpers/bot'
import env from '@/helpers/env'

const ignoredMessages = [
  'bot was blocked by the user',
  'is not a valid URL',
  'Unsupported URL',
  'ctx.from is not defined',
  '404: Not Found',
  'bot was kicked from the supergroup chat',
  'Bad Gateway',
  'message to edit not found',
  '410: Gone',
  'replied message not found',
  'need administrator rights in the channel chat',
  'Video unavailable',
  'No video formats found',
  'error unknown url type',
]

interface ExtraErrorInfo {
  ctx?: Context
  location?: string
  meta?: string
}

function constructErrorMessage(
  error: Error,
  { ctx, location, meta }: ExtraErrorInfo
) {
  const { message } = error
  const chatInfo = ctx?.chat?.id
    ? [`Chat <b>${ctx.chat.id}</b>`]  // Safely access chat.id
    : []
  
  // If ctx.chat exists, add the username if it's available
  if (ctx?.chat?.username) {
    chatInfo.push(`@${ctx.chat.username}`)
  }
  
  // If ctx.callbackQuery exists and contains message with chat info, include it
  if (ctx?.callbackQuery?.message?.chat?.id) {
    chatInfo.push(`Callback Chat <b>${ctx.callbackQuery.message.chat.id}</b>`)
  }

  const result = `${
    location ? `<b>${escape(location)}</b>${ctx ? '\n' : ''}` : ''
  }${chatInfo.filter((v) => !!v).join(', ')}\n${escape(message)}${
    meta ? `\n<code>${meta}</code>` : ''
  }`
  return result
}

async function sendToTelegramChannel(error: Error, info: ExtraErrorInfo) {
  try {
    // Skip known ignored error messages
    if (
      !env.isDevelopment &&
      ignoredMessages.find((m) => error.message.includes(m))
    ) {
      return
    }

    const message = constructErrorMessage(error, info)
    await bot.api.sendMessage(env.CHANNEL_ID, message, {
      parse_mode: 'HTML',
    })

    // Only attempt to forward message if ctx exists and ctx.forwardMessage is defined
    if (info.ctx && info.ctx.forwardMessage) {
      await info.ctx.forwardMessage(env.CHANNEL_ID)
    }
  } catch (sendError) {
    console.error('Error reporting:', sendError)
  }
}

export default function report(error: unknown, info: ExtraErrorInfo = {}) {
  console.error(error, info)
  if (error instanceof Error) {
    void sendToTelegramChannel(error, info)
  } else if (typeof error === 'string') {
    void sendToTelegramChannel(new Error(error), info)
  }
}

function escape(s = '') {
  return s.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/&/g, '&amp;')
}
