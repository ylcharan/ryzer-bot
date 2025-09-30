import puppeteer from "puppeteer";

import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { OpenAIEmbeddings } from "@langchain/openai";
import { Pinecone } from "@pinecone-database/pinecone";
import { PineconeStore } from "@langchain/pinecone";

import * as dotenv from "dotenv";

dotenv.config();

let cachedText = null; // will store the combined FAQ text

const scrapeWebsite = async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  const url = "https://ryzer.app/faq/";

  await page.goto(url);

  const faqs = await page.evaluate(() => {
    const faqElements = document.querySelectorAll(".accordion-item");
    return Array.from(faqElements).map((faq) => {
      const questions = faq.querySelector(".accordion-title-txt").textContent;
      const ans = faq
        .querySelector(".accordion-content p")
        .textContent.replace(/^[\n\t]+/, "");
      return { questions, ans };
    });
  });

  //   console.log(faqs);

  await browser.close();
  return faqs;
};

const run = async () => {
  if (cachedText) return cachedText; // ✅ return cached if already run

  // Step 1: Scrape
  const scrapedData = await scrapeWebsite();

  // Step 2: Convert to text
  const combinedText = scrapedData
    .map((faq) => `Q: ${faq.questions}\nA: ${faq.ans}`)
    .join("\n\n");

  // Step 3: Split text
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 200,
    chunkOverlap: 50,
  });
  const docs = await splitter.createDocuments([combinedText]);

  console.log("📄 Chunks ready:", docs.length);

  // Step 4: Setup Pinecone client
  const pinecone = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY,
  });

  const index = pinecone.Index(
    process.env.PINECONE_INDEX,
    process.env.PINECONE_ENVIRONMENT
  );

  // Step 5: Store embeddings
  await PineconeStore.fromDocuments(docs, new OpenAIEmbeddings(), {
    pineconeIndex: index,
  });
  cachedText = combinedText; // store result for reuse
  return cachedText;
};

import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const text = await run();

export async function POST(req) {
  try {
    const { question } = await req.json();

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", // latest model
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        {
          role: "user",
          content: `
You are a ChatBot assistant for FAQs, factual assistant. Use ONLY the context to answer.
If the answer is not in the context, say you don't know politely.
If the question is not related to the context, politely inform them that you are tuned to only answer questions related to the context.
If the question is not clear, ask for clarification.
If the question is way of greeting, respond in a friendly manner.

Question:
${question}

Context:
${text}

Answer:`,
        },
      ],
      temperature: 0,
    });

    return new Response(
      JSON.stringify({
        answer: response.choices[0].message.content,
      }),
      { status: 200 }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }
}
