import { QueryParams } from '../lexicon/types/app/bsky/feed/getFeedSkeleton'
import { AppContext } from '../config'

// max 15 chars
export const shortname = 'japanese-jazz'

export const handler = async (ctx: AppContext, params: QueryParams) => {
  // Consider adding relevance scoring or other filtering logic here
  // For example, you could prioritize posts with multiple matches
  let builder = ctx.db
    .selectFrom('post')
    .selectAll()
    .orderBy('indexedAt', 'desc')
    .orderBy('cid', 'desc')
    .limit(params.limit)

  if (params.cursor) {
    // Parse the compound cursor (timestamp::cid)
    const [timestamp, cid] = params.cursor.split('::')
    const timeStr = new Date(parseInt(timestamp, 10)).toISOString()
    builder = builder.where('post.indexedAt', '<', timeStr)
  }
  const res = await builder.execute()

  const feed = res.map((row) => ({
    post: row.uri,
  }))

  let cursor: string | undefined
  const last = res.at(-1)
  if (last) {
    // Create a compound cursor with timestamp::cid
    cursor = `${new Date(last.indexedAt).getTime().toString(10)}::${last.cid}`
  }

  return {
    cursor,
    feed,
  }
} 