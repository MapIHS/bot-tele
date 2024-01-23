import "dotenv/config";
import { Telegraf } from 'telegraf'
import { message } from 'telegraf/filters'
import yts from "yt-search";

const bot = new Telegraf(process.env.BOT_TOKEN)
const queque = new Map()

bot.command('quit', async (ctx) => {
  // Explicit usage
  await ctx.telegram.leaveChat(ctx.message.chat.id)

  // Using context shortcut
  await ctx.leaveChat()
})

bot.start((ctx) => {
    if (queque.has(ctx.chat.id)) {
        ctx.reply('You are already in the queque.')
    } else {
        queque.set(ctx.chat.id, ctx)
        ctx.reply('You are now in the queque.')
    
    }
})

bot.on(message('text'), async (ctx) => {
    if (queque.has(ctx.chat.id)) {
        const search = await yts(ctx.message.text)
        const video = search.videos[0]
        const url = video.url
        const title = video.title
        const duration = video.duration.timestamp
        const thumbnail = video.thumbnail
        const description = video.description
        const views = video.views
        const author = video.author.name
        const date = video.ago
        const link = `https://www.youtube.com${url}`
        const message = `Title: ${title}\nDuration: ${duration}\nViews: ${views}\nAuthor: ${author}\nDate: ${date}\nDescription: ${description}\nLink: ${link}`
        bot.telegram.sendPhoto(ctx.chat.id, thumbnail, { caption: message })
        
    }
})

bot.launch()

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))