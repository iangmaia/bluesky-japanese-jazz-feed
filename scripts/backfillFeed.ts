import dotenv from 'dotenv'
import { BskyAgent } from '@atproto/api'
import { createDb, migrateToLatest } from '../src/db'
import { HASHTAGS, ARTISTS, isJapaneseJazzPost } from '../src/constants/japanese-jazz'
import * as readline from 'readline'
import * as fs from 'fs'

dotenv.config()

// Initialize database
const db = createDb(process.env.FEEDGEN_SQLITE_LOCATION || ':memory:')

// Initialize Bluesky agent
const agent = new BskyAgent({
  service: 'https://bsky.social',
})

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

// Promisify readline question
function question(query: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(query, (answer) => {
      resolve(answer)
    })
  })
}

interface Post {
  uri: string;
  cid: string;
  indexedAt: string;
}

export async function searchAndBackfill() {
  try {
    console.log('Starting backfill process...')
    
    // Run database migrations to ensure tables exist
    console.log('Initializing database schema...')
    await migrateToLatest(db)
    console.log('Database schema initialized successfully')
    
    // Get credentials from environment variables
    const handle = process.env.BLUESKY_HANDLE
    const password = process.env.BLUESKY_PASSWORD
    
    if (!handle || !password) {
      throw new Error('Missing BLUESKY_HANDLE or BLUESKY_PASSWORD environment variables')
    }
    
    console.log('Logging in to Bluesky...')
    await agent.login({
      identifier: handle,
      password: password,
    })
    console.log('Login successful!')
    
    // Close readline interface after login
    rl.close()
    
    // Function to search posts based on search terms
    async function searchPosts(searchTerms: string[], maxPostsPerTerm: number): Promise<Post[]> {
      const foundPosts: Post[] = []
      
      for (const term of searchTerms) {
        console.log(`Searching for posts with ${term}...`)
        
        let cursor: string | undefined = undefined
        let hasMore = true
        let count = 0
        
        // Paginate through search results
        while (hasMore && count < maxPostsPerTerm) {
          const searchResult = await agent.app.bsky.feed.searchPosts({
            q: term,
            limit: maxPostsPerTerm,
            cursor,
          })
          
          if (searchResult.data.posts.length === 0) {
            hasMore = false
            continue
          }
          
          console.log(`Found ${searchResult.data.posts.length} posts for ${term}`)
          
          // Filter and add posts to our collection
          for (const post of searchResult.data.posts) {
            if (post.record && 'text' in post.record && typeof post.record.text === 'string') {
              // For artist searches, we don't need to check if it's a Japanese jazz post
              // For hashtag searches, we filter to ensure it's relevant
              if (isJapaneseJazzPost(post.record.text)) {
                foundPosts.push({
                  uri: post.uri,
                  cid: post.cid,
                  indexedAt: new Date().toISOString(),
                })
                count++
              }
            }
          }
          
          cursor = searchResult.data.cursor
          hasMore = !!cursor
          
          // Sleep to avoid rate limits
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
      }
      
      return foundPosts
    }
    
    // Search for posts with hashtags
    const hashtagPosts = await searchPosts(HASHTAGS, 100)
    
    // Search for posts about key artists
    const popularArtists = ARTISTS // .slice(0, 50) // Take first 50 artists to avoid too many requests
    const artistPosts = await searchPosts(popularArtists, 50)
    
    // Combine all found posts
    const japaneseJazzPosts = [...hashtagPosts, ...artistPosts]
    
    // Remove duplicates by URI
    const uniquePosts = Array.from(
      new Map(japaneseJazzPosts.map(post => [post.uri, post])).values()
    )
    
    console.log(`Found ${uniquePosts.length} unique Japanese jazz posts`)
    
    // Insert posts into the database
    if (uniquePosts.length > 0) {
      await db
        .insertInto('post')
        .values(uniquePosts)
        .onConflict((oc) => oc.doNothing())
        .execute()
      
      console.log(`Successfully added ${uniquePosts.length} posts to the database`)
    }
    
    // // Initialize sub_state table if it doesn't have an entry for the Bluesky network
    // const subState = await db
    //   .selectFrom('sub_state')
    //   .where('service', '=', 'wss://bsky.network')
    //   .executeTakeFirst()
    
    // if (!subState) {
    //   await db
    //     .insertInto('sub_state')
    //     .values({
    //       service: 'wss://bsky.network',
    //       cursor: 0
    //     })
    //     .execute()
    //   console.log('Initialized subscription state for Bluesky network')
    // }
    
    console.log('Backfill process completed successfully!')
  } catch (error) {
    console.error('Error during backfill process:', error)
  } finally {
    // Close the database connection
    await db.destroy()
    
    // Ensure readline interface is closed
    if (rl.listenerCount('line') > 0) {
      rl.close()
    }
  }
}

// Move the direct execution to a conditional
if (require.main === module) {
  // Run the backfill process when script is executed directly
  searchAndBackfill()
}
