import {
  OutputSchema as RepoEvent,
  isCommit,
} from './lexicon/types/com/atproto/sync/subscribeRepos'
import { FirehoseSubscriptionBase, getOpsByType } from './util/subscription'
import { isJapaneseJazzPost } from './constants/japanese-jazz'

export class FirehoseSubscription extends FirehoseSubscriptionBase {
  async handleEvent(evt: RepoEvent) {
    if (!isCommit(evt)) return

    const ops = await getOpsByType(evt)

    // For debugging: log Japanese jazz posts
    for (const post of ops.posts.creates) {
      if (isJapaneseJazzPost(post.record.text)) {
        const postUrl = `https://bsky.app/profile/${post.author}/post/${post.uri.split('/').pop()}`
        console.log('Found Japanese jazz post:', post.record.text.substring(0, 100) + '...', 'URL:', postUrl)
      }
    }

    const postsToDelete = ops.posts.deletes.map((del) => del.uri)
    const postsToCreate = ops.posts.creates
      .filter((create) => {
        // Only Japanese jazz related posts
        return isJapaneseJazzPost(create.record.text)
      })
      .map((create) => {
        // Map Japanese jazz posts to a db row
        return {
          uri: create.uri,
          cid: create.cid,
          indexedAt: new Date().toISOString(),
        }
      })

    if (postsToDelete.length > 0) {
      await this.db
        .deleteFrom('post')
        .where('uri', 'in', postsToDelete)
        .execute()
    }
    if (postsToCreate.length > 0) {
      await this.db
        .insertInto('post')
        .values(postsToCreate)
        .onConflict((oc) => oc.doNothing())
        .execute()
    }
  }
}
