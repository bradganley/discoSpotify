import fetch from 'node-fetch';
import Parser from 'rss-parser';
import * as dotenv from 'dotenv';

dotenv.config();
const LOOPTIME = process.env.LOOPTIME
const RSS_URL = process.env.RSS;
const DISCORD_WEBHOOK_URL = process.env.DISCORD;
const footer = process.env.FOOTER || "New track added"
const parser = new Parser();

if (!RSS_URL || !DISCORD_WEBHOOK_URL) {
    console.error('put RSS and DISCORD urls in your .env file, dumbass');
    process.exit(1);
}

let lastPostTitle: string = '';

async function checkRSSFeed(): Promise<void> {
    try {
        const feed = await parser.parseURL(RSS_URL);
        const latestPost = feed.items[0];
        console.log("Checking at " + new Date());  
        if (latestPost.title !== lastPostTitle) {
            lastPostTitle = latestPost.title;
            await sendToDiscord(latestPost);
        }
    } catch (error) {
        console.error('Shit:', error);
    }
}
async function sendToDiscord(post: any): Promise<void> {
    const embed = {
        title: `${post.title} - ${post.author}`,
        url: post.link,
        color: 0x1DB954,
        footer: {
            text: footer,
        },
        timestamp: new Date(),
    };    
//    console.log(post);
    const imageUrlMatch = post.content.match(/<img[^>]+src="([^">]+)"/);
//    console.log(imageUrlMatch);
    embed.image = { url: imageUrlMatch[1], };
    const message = {
        embeds: [embed],
    };

    try {
        await fetch(DISCORD_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(message),
        });
        console.log('Message sent to Discord:', post.title);
    } catch (error) {
        console.error('Fuck:', error);
    }
}
checkRSSFeed();
setInterval(checkRSSFeed, LOOPTIME);
