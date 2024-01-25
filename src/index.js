import "dotenv/config";
import { Markup, Telegraf } from 'telegraf'
import { message } from 'telegraf/filters'
import yts from "yt-search";
import { youtubedl } from "@bochilteam/scraper"
import axios from "axios";
import fakeUa from "fake-useragent";

const bot = new Telegraf(process.env.BOT_TOKEN)
const queque = new Map()
const getBuffer = async (url) => (await axios.get(url, {
    responseType: 'arraybuffer', headers: {
        'User-Agent': fakeUa()
    }
})).data

bot.start((ctx) => {
    if (queque.has(ctx.chat.id)) {
        ctx.reply('Sesi Kamu Sudah Aktif, Silahkan Ketik /quit Untuk Keluar Dari Sesi.')
    } else {
        queque.set(ctx.chat.id, ctx)
        ctx.reply('Sesi Kamu Sudah Aktif, Anda Bisa Memulai Mencari Music Dengan Mengetik Judul Music Yang Ingin Kamu Cari.')

    }
})

bot.command('quit', (ctx) => {
    queque.delete(ctx.chat.id)
    ctx.reply('Sesi Kamu Sudah Berakhir, Silahkan Ketik /start Untuk Memulai Sesi Kembali.')
})

bot.on(message('text'), async (ctx) => {
    const markup = Markup.inlineKeyboard([])

    if (queque.has(ctx.chat.id)) {
        const search = (await yts(ctx.message.text)).videos
        if (!search.length) return ctx.reply('No videos found.')
        const i = 0
        const video = search[i]
        const url = video.url
        const title = video.title
        const duration = video.duration.timestamp
        const description = video.description
        const views = video.views
        const author = video.author.name
        const date = video.ago
        const message = `Title: ${title}\nDuration: ${duration}\nViews: ${views}\nAuthor: ${author}\nDate: ${date}\nDescription: ${description}\nLink: ${url}`
        markup.reply_markup.inline_keyboard.push([
            Markup.button.callback("Download", `a_${encodeURIComponent(url)}`),
            Markup.button.callback("→", `next_${i}_${ctx.message.text}`)
        ]);

        ctx.sendMessage(message, markup)
    }
})

bot.action(/(a|v)_(.*)/, async (ctx) => {
    const [, type, url] = ctx.match
    const { audio, title, thumbnail } = await youtubedl(decodeURIComponent(url))
    ctx.editMessageText(`Downloading ${type === "a" ? "Audio" : "Video"} From ${title}`)

    switch (type) {
        case 'a':
            for (let i in audio) {
                const { quality, fileSizeH, download } = audio[i]
                bot.telegram.sendAudio(ctx.chat.id, {
                    source: await getBuffer(await download()),
                    filename: `${title}.mp3`,
                }, {
                    title: title,
                    thumbnail: await getBuffer(thumbnail),
                    caption: `Quality: ${quality}\nSize: ${fileSizeH}`
                })
            }
            break
    }
})

bot.action(/next_(\d+)_(.*)/, async (ctx) => {
    const [, i, text] = ctx.match
    const search = (await yts(text)).videos
    if (!search.length) return ctx.reply('No videos found.')
    let next = parseInt(i) + 1
    if (next >= search.length) return bot.telegram.reply('No more videos found.')
    const video = search[next]
    const url = video.url
    const title = video.title
    const duration = video.duration.timestamp
    const views = video.views
    const author = video.author.name
    const date = video.ago
    const message = `Title: ${title}\nDuration: ${duration}\n Views: ${views}\nAuthor: ${author}\nDate: ${date}\nLink: ${url}`
    const markup = Markup.inlineKeyboard([])

    markup.reply_markup.inline_keyboard.push([
        Markup.button.callback("Download", `a_${encodeURIComponent(url)}`),
        Markup.button.callback("→", `next_${next}_${text}`)
    ]);

    await ctx.editMessageText(message, markup)
})

bot.telegram.setMyCommands([
    { command: 'start', description: 'Start Bot' },
    { command: 'quit', description: 'Quit Bot' }
])

await bot.launch()

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))